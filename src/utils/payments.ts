import { API } from './api'
import type { TelegramWebApp } from '../hooks/useTelegram'

// Расширяем Window для поддержки Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp & {
        Invoice?: {
          open: (invoice: any, callback: (status: string) => void) => void
        }
      }
    }
  }
}

interface PaymentParams {
  orderId: number
  amount: number // в копейках
  description: string
  userId: number
}

interface PaymentResult {
  success: boolean
  error?: string
  transactionId?: string
}

/**
 * Обработка платежа через Telegram Payments API
 */
export const processTelegramPayment = async (params: PaymentParams): Promise<PaymentResult> => {
  const { orderId, amount, description, userId } = params

  // Проверяем наличие Telegram WebApp
  if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
    return {
      success: false,
      error: 'Telegram WebApp не доступен',
    }
  }

  const tg = window.Telegram.WebApp

  // Проверяем поддержку платежей
  if (!tg.Invoice) {
    // Если Telegram Payments недоступен, используем тестовый режим
    console.warn('Telegram Payments API недоступен, используем тестовый режим')
    try {
      // В тестовом режиме просто обновляем статус через API
      await API.orders.update(orderId, { status: 'paid' }, userId)
      return {
        success: true,
        transactionId: `test_${Date.now()}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка обработки платежа',
      }
    }
  }

  // Создаем инвойс для Telegram Payments
  const invoice = {
    title: description,
    description: `Оплата заказа #${orderId}`,
    currency: 'RUB',
    prices: [
      {
        label: description,
        amount: amount, // в копейках
      },
    ],
    payload: JSON.stringify({
      orderId,
      userId,
    }),
  }

  return new Promise((resolve) => {
    // Открываем форму оплаты Telegram
    tg.Invoice.open(invoice, (status: string) => {
      if (status === 'paid') {
        // Платеж успешен
        resolve({
          success: true,
          transactionId: `tg_${Date.now()}`,
        })
      } else if (status === 'cancelled') {
        resolve({
          success: false,
          error: 'Оплата отменена',
        })
      } else if (status === 'failed') {
        resolve({
          success: false,
          error: 'Ошибка оплаты',
        })
      } else {
        resolve({
          success: false,
          error: 'Неизвестный статус платежа',
        })
      }
    })
  })
}

/**
 * Обработка рассрочки
 */
export const processInstallmentPayment = async (params: PaymentParams): Promise<PaymentResult> => {
  const { orderId, amount, userId } = params

  // Для рассрочки создаем заказ с особым статусом
  try {
    // Обновляем заказ, добавляя информацию о рассрочке
    await API.orders.update(orderId, { 
      status: 'pending',
      comment: `Рассрочка: ${Math.round(amount / 4)} ₽/мес на 4 месяца`,
    }, userId)

    return {
      success: true,
      transactionId: `installment_${Date.now()}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка оформления рассрочки',
    }
  }
}

