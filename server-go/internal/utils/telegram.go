package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/url"
	"os"
	"sort"
	"strings"
)

// ValidateTelegramInitData validates Telegram WebApp initData
func ValidateTelegramInitData(initData string) (map[string]string, error) {
	botToken := os.Getenv("BOT_TOKEN")
	if botToken == "" {
		return nil, fmt.Errorf("BOT_TOKEN environment variable is required")
	}

	params, err := url.ParseQuery(initData)
	if err != nil {
		return nil, fmt.Errorf("invalid initData format: %w", err)
	}

	hash := params.Get("hash")
	if hash == "" {
		return nil, fmt.Errorf("hash is missing")
	}

	params.Del("hash")

	// Create data check string
	var pairs []string
	for key, values := range params {
		if len(values) > 0 {
			pairs = append(pairs, fmt.Sprintf("%s=%s", key, values[0]))
		}
	}
	sort.Strings(pairs)
	dataCheckString := strings.Join(pairs, "\n")

	// Calculate secret
	secretKey := hmac.New(sha256.New, []byte("WebAppData"))
	secretKey.Write([]byte(botToken))
	secret := secretKey.Sum(nil)

	// Calculate hash
	hashKey := hmac.New(sha256.New, secret)
	hashKey.Write([]byte(dataCheckString))
	calculatedHash := hex.EncodeToString(hashKey.Sum(nil))

	if calculatedHash != hash {
		return nil, fmt.Errorf("invalid hash")
	}

	// Convert params to map
	result := make(map[string]string)
	for key, values := range params {
		if len(values) > 0 {
			result[key] = values[0]
		}
	}

	return result, nil
}

