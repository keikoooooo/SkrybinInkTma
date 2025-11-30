package utils

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"strings"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// CloudinaryImageStorage хранит изображения в Cloudinary
type CloudinaryImageStorage struct {
	cld *cloudinary.Cloudinary
	ctx context.Context
}

// NewCloudinaryImageStorage создает Cloudinary хранилище
func NewCloudinaryImageStorage() (*CloudinaryImageStorage, error) {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		return nil, fmt.Errorf("Cloudinary credentials not configured")
	}

	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Cloudinary: %w", err)
	}

	return &CloudinaryImageStorage{
		cld: cld,
		ctx: context.Background(),
	}, nil
}

// Upload загружает файл в Cloudinary
func (s *CloudinaryImageStorage) Upload(file multipart.File, header *multipart.FileHeader, imageType string) (string, error) {
	// Читаем файл
	file.Seek(0, 0)
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	// Генерируем public_id на основе типа
	publicID := fmt.Sprintf("skryabin-ink/%s/%s", imageType, generateUniqueID())

	// Параметры загрузки
	overwrite := false
	uniqueFilename := true
	uploadParams := uploader.UploadParams{
		PublicID:       publicID,
		Folder:         fmt.Sprintf("skryabin-ink/%s", imageType),
		ResourceType:   "image",
		Overwrite:      &overwrite,
		UniqueFilename: &uniqueFilename,
		// Автоматическая оптимизация через transformation
		Transformation: "q_auto:best,f_auto",
	}

	// Загружаем в Cloudinary
	result, err := s.cld.Upload.Upload(s.ctx, fileBytes, uploadParams)
	if err != nil {
		return "", fmt.Errorf("failed to upload to Cloudinary: %w", err)
	}

	return result.SecureURL, nil
}

// Delete удаляет файл из Cloudinary
func (s *CloudinaryImageStorage) Delete(url string) error {
	// Извлекаем public_id из URL
	publicID, err := extractPublicIDFromURL(url)
	if err != nil {
		return fmt.Errorf("failed to extract public_id: %w", err)
	}

	// Удаляем из Cloudinary
	_, err = s.cld.Upload.Destroy(s.ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	if err != nil {
		return fmt.Errorf("failed to delete from Cloudinary: %w", err)
	}

	return nil
}

// extractPublicIDFromURL извлекает public_id из Cloudinary URL
func extractPublicIDFromURL(url string) (string, error) {
	// Cloudinary URL формат: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
	// Или: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
	
	// Ищем /upload/ в URL
	uploadIdx := strings.Index(url, "/upload/")
	if uploadIdx == -1 {
		return "", fmt.Errorf("invalid Cloudinary URL: no /upload/ found")
	}

	// Берем часть после /upload/
	pathAfterUpload := url[uploadIdx+8:] // 8 = len("/upload/")
	
	// Убираем параметры запроса если есть
	if queryIdx := strings.Index(pathAfterUpload, "?"); queryIdx != -1 {
		pathAfterUpload = pathAfterUpload[:queryIdx]
	}
	
	// Разбиваем по /
	parts := strings.Split(pathAfterUpload, "/")
	
	// Последняя часть - это public_id с расширением
	if len(parts) == 0 {
		return "", fmt.Errorf("invalid Cloudinary URL: no path after upload")
	}
	
	filename := parts[len(parts)-1]
	
	// Убираем расширение
	return removeExtension(filename), nil
}

func removeExtension(filename string) string {
	// Убираем расширение файла
	lastDot := strings.LastIndex(filename, ".")
	if lastDot == -1 {
		return filename
	}
	return filename[:lastDot]
}

func generateUniqueID() string {
	// Генерируем уникальный ID используя timestamp и случайные байты
	randomBytes := make([]byte, 8)
	rand.Read(randomBytes)
	timestamp := time.Now().Unix()
	return fmt.Sprintf("%d_%s", timestamp, hex.EncodeToString(randomBytes))
}

