package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"skryabin-ink-server/internal/utils"
)

// UploadImage handles POST /api/upload/image
func (h *Handlers) UploadImage(c *gin.Context) {
	// Проверяем авторизацию
	userIDStr := c.GetHeader("X-User-ID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "authentication required"})
		return
	}

	// Получаем файл
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "file is required"})
		return
	}
	defer file.Close()

	// Валидация файла
	if err := utils.ValidateImageFile(header); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	// Получаем тип изображения
	imageType := c.PostForm("type")
	if imageType == "" {
		imageType = "work" // По умолчанию
	}

	// Проверяем допустимые типы
	allowedTypes := map[string]bool{
		"work":   true,
		"artist": true,
		"user":   true,
	}
	if !allowedTypes[imageType] {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "invalid image type"})
		return
	}

	// Инициализируем хранилище (Cloudinary или локальное)
	var storage utils.ImageStorage

	// Проверяем, настроен ли Cloudinary
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName != "" && apiKey != "" && apiSecret != "" {
		// Используем Cloudinary
		cloudinaryStorage, err := utils.NewCloudinaryImageStorage()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to initialize Cloudinary: " + err.Error()})
			return
		}
		storage = cloudinaryStorage
	} else {
		// Используем локальное хранилище
		uploadDir := os.Getenv("UPLOAD_DIR")
		if uploadDir == "" {
			uploadDir = "./uploads"
		}

		publicURL := os.Getenv("PUBLIC_URL")
		if publicURL == "" {
			publicURL = "http://localhost:8080"
		}

		storage = utils.NewLocalImageStorage(uploadDir, publicURL)
	}

	// Загружаем файл
	url, err := storage.Upload(file, header, imageType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "failed to upload image: " + err.Error()})
		return
	}

	if url == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "upload succeeded but no URL returned"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":  true,
		"url": url,
	})
}

