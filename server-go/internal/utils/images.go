package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ImageStorage интерфейс для хранения изображений
type ImageStorage interface {
	Upload(file multipart.File, header *multipart.FileHeader, imageType string) (string, error)
	Delete(url string) error
}

// LocalImageStorage хранит изображения локально
type LocalImageStorage struct {
	UploadDir string
	PublicURL string
}

// NewLocalImageStorage создает локальное хранилище
func NewLocalImageStorage(uploadDir, publicURL string) *LocalImageStorage {
	// Создаем необходимые директории
	dirs := []string{
		filepath.Join(uploadDir, "images", "works"),
		filepath.Join(uploadDir, "images", "artists"),
		filepath.Join(uploadDir, "images", "users"),
	}
	
	for _, dir := range dirs {
		os.MkdirAll(dir, 0755)
	}
	
	return &LocalImageStorage{
		UploadDir: uploadDir,
		PublicURL: publicURL,
	}
}

// Upload сохраняет файл локально
func (s *LocalImageStorage) Upload(file multipart.File, header *multipart.FileHeader, imageType string) (string, error) {
	// Генерируем уникальное имя файла
	randomBytes := make([]byte, 16)
	rand.Read(randomBytes)
	filename := hex.EncodeToString(randomBytes) + filepath.Ext(header.Filename)
	
	// Определяем путь сохранения
	var savePath string
	switch imageType {
	case "work":
		savePath = filepath.Join(s.UploadDir, "images", "works", filename)
	case "artist":
		savePath = filepath.Join(s.UploadDir, "images", "artists", filename)
	case "user":
		savePath = filepath.Join(s.UploadDir, "images", "users", filename)
	default:
		savePath = filepath.Join(s.UploadDir, "images", filename)
	}
	
	// Создаем файл
	dst, err := os.Create(savePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()
	
	// Копируем содержимое
	file.Seek(0, 0)
	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}
	
	// Возвращаем публичный URL
	relativePath := strings.TrimPrefix(savePath, s.UploadDir)
	relativePath = strings.ReplaceAll(relativePath, "\\", "/")
	if !strings.HasPrefix(relativePath, "/") {
		relativePath = "/" + relativePath
	}
	
	return s.PublicURL + relativePath, nil
}

// Delete удаляет файл
func (s *LocalImageStorage) Delete(url string) error {
	// Извлекаем путь из URL
	if !strings.HasPrefix(url, s.PublicURL) {
		return fmt.Errorf("invalid URL")
	}
	
	relativePath := strings.TrimPrefix(url, s.PublicURL)
	filePath := filepath.Join(s.UploadDir, relativePath)
	
	return os.Remove(filePath)
}

// ValidateImageFile проверяет файл изображения
func ValidateImageFile(header *multipart.FileHeader) error {
	// Проверяем размер (максимум 10MB)
	const maxSize = 10 << 20 // 10MB
	if header.Size > maxSize {
		return fmt.Errorf("file too large: maximum size is 10MB")
	}
	
	// Проверяем расширение
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowedExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	allowed := false
	for _, allowedExt := range allowedExts {
		if ext == allowedExt {
			allowed = true
			break
		}
	}
	
	if !allowed {
		return fmt.Errorf("invalid file type: only jpg, jpeg, png, gif, webp are allowed")
	}
	
	return nil
}

// GenerateImagePath генерирует путь для изображения
func GenerateImagePath(imageType string) string {
	timestamp := time.Now().Unix()
	randomBytes := make([]byte, 8)
	rand.Read(randomBytes)
	randomStr := hex.EncodeToString(randomBytes)
	
	return fmt.Sprintf("%s/%d_%s", imageType, timestamp, randomStr)
}

