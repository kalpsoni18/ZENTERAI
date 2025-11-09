package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

type Config struct {
	APIEndpoint    string `json:"api_endpoint"`
	AccessToken    string `json:"access_token"`
	LocalPath      string `json:"local_path"`
	RemotePath     string `json:"remote_path"`
	OrgID          string `json:"org_id"`
	SyncInterval   int    `json:"sync_interval_seconds"`
	WatchEnabled   bool   `json:"watch_enabled"`
}

type SyncState struct {
	mu          sync.RWMutex
	lastSync    time.Time
	syncing     bool
	errors      []string
}

var (
	config    Config
	syncState SyncState
	httpClient *http.Client
)

func main() {
	// Load config
	configPath := os.Getenv("ZENTERAI_CONFIG")
	if configPath == "" {
		configPath = "/etc/zenterai/config.json"
	}

	configData, err := os.ReadFile(configPath)
	if err != nil {
		log.Fatalf("Failed to read config: %v", err)
	}

	if err := json.Unmarshal(configData, &config); err != nil {
		log.Fatalf("Failed to parse config: %v", err)
	}

	// Setup HTTP client
	httpClient = &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: false,
			},
		},
	}

	// Start sync loop
	ticker := time.NewTicker(time.Duration(config.SyncInterval) * time.Second)
	defer ticker.Stop()

	// Initial sync
	if err := syncFiles(); err != nil {
		log.Printf("Initial sync failed: %v", err)
	}

	// Periodic sync
	for range ticker.C {
		if err := syncFiles(); err != nil {
			log.Printf("Sync failed: %v", err)
		}
	}
}

func syncFiles() error {
	syncState.mu.Lock()
	if syncState.syncing {
		syncState.mu.Unlock()
		return fmt.Errorf("sync already in progress")
	}
	syncState.syncing = true
	syncState.mu.Unlock()

	defer func() {
		syncState.mu.Lock()
		syncState.syncing = false
		syncState.lastSync = time.Now()
		syncState.mu.Unlock()
	}()

	// Get upload credentials from API
	creds, err := getUploadCredentials()
	if err != nil {
		return fmt.Errorf("failed to get credentials: %v", err)
	}

	// Setup AWS session
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String(creds.Region),
		Credentials: credentials.NewStaticCredentials(creds.AccessKeyID, creds.SecretAccessKey, creds.SessionToken),
	})
	if err != nil {
		return fmt.Errorf("failed to create AWS session: %v", err)
	}

	// Walk local directory
	return filepath.Walk(config.LocalPath, func(localPath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(config.LocalPath, localPath)
		if err != nil {
			return err
		}

		remoteKey := filepath.Join(config.RemotePath, relPath)

		// Check if file needs sync
		if needsSync(localPath, remoteKey, info, sess) {
			if err := uploadFile(localPath, remoteKey, sess); err != nil {
				log.Printf("Failed to upload %s: %v", localPath, err)
				return err
			}
		}

		return nil
	})
}

func getUploadCredentials() (*UploadCredentials, error) {
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api/agent/credentials", config.APIEndpoint), nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", config.AccessToken))
	req.Header.Set("X-Org-ID", config.OrgID)

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var creds UploadCredentials
	if err := json.NewDecoder(resp.Body).Decode(&creds); err != nil {
		return nil, err
	}

	return &creds, nil
}

type UploadCredentials struct {
	AccessKeyID     string `json:"access_key_id"`
	SecretAccessKey string `json:"secret_access_key"`
	SessionToken    string `json:"session_token"`
	Region          string `json:"region"`
	Bucket          string `json:"bucket"`
}

func needsSync(localPath, remoteKey string, info os.FileInfo, sess *session.Session) bool {
	svc := s3.New(sess)
	
	head, err := svc.HeadObject(&s3.HeadObjectInput{
		Bucket: aws.String(config.OrgID),
		Key:    aws.String(remoteKey),
	})
	
	if err != nil {
		return true // File doesn't exist remotely, needs sync
	}

	// Compare modification times
	remoteModTime := *head.LastModified
	localModTime := info.ModTime()

	return localModTime.After(remoteModTime)
}

func uploadFile(localPath, remoteKey string, sess *session.Session) error {
	file, err := os.Open(localPath)
	if err != nil {
		return err
	}
	defer file.Close()

	uploader := s3manager.NewUploader(sess)
	_, err = uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(config.OrgID),
		Key:    aws.String(remoteKey),
		Body:   file,
	})

	return err
}

