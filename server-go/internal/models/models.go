package models

import "time"

// User represents a Telegram user
type User struct {
	ID                int64     `json:"id" db:"id"`
	Username          *string   `json:"username" db:"username"`
	FirstName         *string   `json:"first_name" db:"first_name"`
	LastName          *string   `json:"last_name" db:"last_name"`
	LanguageCode      *string   `json:"language_code" db:"language_code"`
	PhotoURL          *string   `json:"photo_url" db:"photo_url"`
	Role              string    `json:"role" db:"role"`
	BalanceCents      int       `json:"balance_cents" db:"balance_cents"`
	BonusPoints       int       `json:"bonus_points" db:"bonus_points"`
	PersonalDiscount  int       `json:"personal_discount" db:"personal_discount"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

// Artist represents a tattoo artist
type Artist struct {
	ID        int       `json:"id" db:"id"`
	DisplayName string  `json:"display_name" db:"display_name"`
	Bio       *string   `json:"bio" db:"bio"`
	AvatarURL *string   `json:"avatar_url" db:"avatar_url"`
	IsActive  bool      `json:"is_active" db:"is_active"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Style represents a tattoo style
type Style struct {
	ID          int       `json:"id" db:"id"`
	Code        string    `json:"code" db:"code"`
	Title       string    `json:"title" db:"title"`
	Description *string   `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Work represents a tattoo work/portfolio piece
type Work struct {
	ID        int       `json:"id" db:"id"`
	ArtistID  *int      `json:"artist_id" db:"artist_id"`
	StyleID   *int      `json:"style_id" db:"style_id"`
	ImageURL  string    `json:"image_url" db:"image_url"`
	Caption   *string   `json:"caption" db:"caption"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Product represents a product/service
type Product struct {
	ID          int       `json:"id" db:"id"`
	StyleID     *int      `json:"style_id" db:"style_id"`
	Title       string    `json:"title" db:"title"`
	Description *string   `json:"description" db:"description"`
	PriceCents  int       `json:"price_cents" db:"price_cents"`
	ProductType string    `json:"product_type" db:"product_type"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	Style       *Style    `json:"style,omitempty"`
}

// Order represents an order
type Order struct {
	ID          int            `json:"id" db:"id"`
	UserID      int64          `json:"user_id" db:"user_id"`
	Status      string         `json:"status" db:"status"`
	TotalCents  int            `json:"total_cents" db:"total_cents"`
	PromoCode   *string        `json:"promo_code" db:"promo_code"`
	Comment     *string        `json:"comment" db:"comment"`
	ScheduledAt *time.Time     `json:"scheduled_at" db:"scheduled_at"`
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at" db:"updated_at"`
	Items       []OrderItem    `json:"items,omitempty"`
}

// OrderItem represents an item in an order
type OrderItem struct {
	ID        int     `json:"id" db:"id"`
	OrderID   int     `json:"order_id" db:"order_id"`
	ProductID *int    `json:"product_id" db:"product_id"`
	Quantity  int     `json:"quantity" db:"quantity"`
	PriceCents int    `json:"price_cents" db:"price_cents"`
	BodyZone  *string `json:"body_zone" db:"body_zone"`
	Notes     *string `json:"notes" db:"notes"`
}

// Appointment represents a scheduled appointment
type Appointment struct {
	ID          int        `json:"id" db:"id"`
	OrderID     int        `json:"order_id" db:"order_id"`
	ArtistID    *int       `json:"artist_id" db:"artist_id"`
	ScheduledAt *time.Time `json:"scheduled_at" db:"scheduled_at"`
	Status      string     `json:"status" db:"status"`
	Comment     *string    `json:"comment" db:"comment"`
}

// Favorite represents a user's favorite work
type Favorite struct {
	ID        int       `json:"id" db:"id"`
	UserID    int64     `json:"user_id" db:"user_id"`
	WorkID    int       `json:"work_id" db:"work_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	Work      *Work     `json:"work,omitempty"`
}

// Review represents a review
type Review struct {
	ID          int       `json:"id" db:"id"`
	UserID      int64     `json:"user_id" db:"user_id"`
	ArtistID    *int      `json:"artist_id" db:"artist_id"`
	WorkID      *int      `json:"work_id" db:"work_id"`
	Rating      int       `json:"rating" db:"rating"`
	Content     *string   `json:"content" db:"content"`
	IsPublished bool      `json:"is_published" db:"is_published"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Deposit represents a deposit/certificate
type Deposit struct {
	ID             int        `json:"id" db:"id"`
	UserID         int64      `json:"user_id" db:"user_id"`
	AmountCents    int        `json:"amount_cents" db:"amount_cents"`
	CertificateCode *string   `json:"certificate_code" db:"certificate_code"`
	ExpiresAt      *time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
}

// Notification represents a notification
type Notification struct {
	ID      int       `json:"id" db:"id"`
	UserID  *int64    `json:"user_id" db:"user_id"`
	Type    string    `json:"type" db:"type"`
	Payload *string   `json:"payload" db:"payload"`
	SentAt  time.Time `json:"sent_at" db:"sent_at"`
}

// Request DTOs
type CreateSessionRequest struct {
	InitData string `json:"initData" binding:"required"`
}

type CreateOrderRequest struct {
	Items        []CreateOrderItemRequest `json:"items" binding:"required"`
	PromoCode    *string                  `json:"promo_code"`
	Comment      *string                  `json:"comment"`
	PaymentMethod *string                 `json:"payment_method"`
}

type CreateOrderItemRequest struct {
	ProductID int     `json:"product_id" binding:"required"`
	Quantity  int     `json:"quantity" binding:"required,min=1"`
	BodyZone  *string `json:"body_zone"`
	Notes     *string `json:"notes"`
}

type UpdateOrderRequest struct {
	Status      *string    `json:"status"`
	Comment     *string    `json:"comment"`
	ScheduledAt *time.Time `json:"scheduled_at"`
}

type CreateReviewRequest struct {
	ArtistID *int    `json:"artist_id"`
	WorkID   *int    `json:"work_id"`
	Rating   int     `json:"rating" binding:"required,min=1,max=5"`
	Content  *string `json:"content"`
}

type CreateDepositRequest struct {
	AmountCents    int        `json:"amount_cents" binding:"required,min=1"`
	CertificateCode *string   `json:"certificate_code"`
	ExpiresAt      *time.Time `json:"expires_at"`
}

type CreateAppointmentRequest struct {
	OrderID     int        `json:"order_id" binding:"required"`
	ArtistID    *int       `json:"artist_id"`
	ScheduledAt *time.Time `json:"scheduled_at"`
	Comment     *string    `json:"comment"`
}

type CreateProductRequest struct {
	StyleID     *int    `json:"style_id"`
	Title       string  `json:"title" binding:"required"`
	Description *string `json:"description"`
	PriceCents  int     `json:"price_cents" binding:"required,min=0"`
	ProductType string  `json:"product_type" binding:"required"`
	IsActive    bool    `json:"is_active"`
}

type CreateWorkRequest struct {
	ArtistID *int    `json:"artist_id"`
	StyleID  *int    `json:"style_id"`
	ImageURL string  `json:"image_url" binding:"required"`
	Caption  *string `json:"caption"`
}

type CreateArtistRequest struct {
	DisplayName string  `json:"display_name" binding:"required"`
	Bio         *string `json:"bio"`
	AvatarURL   *string `json:"avatar_url"`
	IsActive    bool    `json:"is_active"`
}

type AddFavoriteRequest struct {
	WorkID int `json:"work_id" binding:"required"`
}

