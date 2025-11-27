package database

import (
	"database/sql"
	"fmt"
	"os"
	"strings"

	_ "github.com/lib/pq"
)

func findSubstring(s, substr string) int {
	return strings.Index(s, substr)
}

func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}

func InitDB() (*sql.DB, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	// Исправляем неправильный формат DATABASE_URL
	// Если есть запятая перед URL, убираем её
	if len(databaseURL) > 0 && databaseURL[0] != 'p' {
		// Ищем начало postgres:// или postgresql://
		postgresIdx := -1
		if idx := findSubstring(databaseURL, "postgresql://"); idx != -1 {
			postgresIdx = idx
		} else if idx := findSubstring(databaseURL, "postgres://"); idx != -1 {
			postgresIdx = idx
		}
		if postgresIdx > 0 {
			databaseURL = databaseURL[postgresIdx:]
		}
	}

	// Убеждаемся, что sslmode указан правильно
	// Если не указан, используем disable (большинство БД не требуют SSL)
	if !contains(databaseURL, "sslmode=") {
		separator := "?"
		if contains(databaseURL, "?") {
			separator = "&"
		}
		// По умолчанию используем disable
		databaseURL = databaseURL + separator + "sslmode=disable"
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return db, nil
}

