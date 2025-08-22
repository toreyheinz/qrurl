import QRCode from 'qrcode'

export async function generateQRCode(text, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'H', // High - allows 30% damage for logo overlay
    type: 'image/png',
    quality: 0.92,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 512
  }

  const qrOptions = { ...defaultOptions, ...options }

  try {
    const dataUrl = await QRCode.toDataURL(text, qrOptions)
    return dataUrl
  } catch (error) {
    console.error('QR Code generation error:', error)
    throw error
  }
}

export async function generateQRCodeWithLogo(text, logoUrl, options = {}) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  canvas.width = options.width || 512
  canvas.height = options.height || 512

  // Generate QR code
  const qrDataUrl = await generateQRCode(text, {
    ...options,
    errorCorrectionLevel: 'H'
  })

  // Draw QR code
  const qrImage = new Image()
  qrImage.src = qrDataUrl
  
  return new Promise((resolve, reject) => {
    qrImage.onload = () => {
      ctx.drawImage(qrImage, 0, 0, canvas.width, canvas.height)

      if (logoUrl) {
        // Add logo
        const logo = new Image()
        logo.crossOrigin = 'anonymous'
        logo.src = logoUrl

        logo.onload = () => {
          // Calculate logo size (max 30% of QR code)
          const logoSize = Math.floor(canvas.width * 0.3)
          const logoX = (canvas.width - logoSize) / 2
          const logoY = (canvas.height - logoSize) / 2

          // Draw white background for logo
          ctx.fillStyle = 'white'
          ctx.fillRect(logoX - 10, logoY - 10, logoSize + 20, logoSize + 20)

          // Draw logo
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)

          resolve(canvas.toDataURL())
        }

        logo.onerror = () => {
          // If logo fails to load, return QR without logo
          resolve(qrDataUrl)
        }
      } else {
        resolve(qrDataUrl)
      }
    }

    qrImage.onerror = reject
  })
}