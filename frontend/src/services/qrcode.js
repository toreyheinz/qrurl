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
  console.log('Generating QR code with logo:', logoUrl)
  
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
        // Fetch logo as blob to avoid CORS issues
        fetch(logoUrl)
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch logo')
            return response.blob()
          })
          .then(blob => {
            const logo = new Image()
            const objectUrl = URL.createObjectURL(blob)
            
            logo.onload = () => {
              // Calculate logo size (max 25% of QR code for better scanning)
              const logoSize = Math.floor(canvas.width * 0.25)
              const logoX = (canvas.width - logoSize) / 2
              const logoY = (canvas.height - logoSize) / 2

              // Draw white background with rounded corners
              ctx.fillStyle = 'white'
              const padding = 8
              ctx.fillRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2)

              // Draw logo
              ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
              
              // Clean up
              URL.revokeObjectURL(objectUrl)
              
              resolve(canvas.toDataURL())
            }

            logo.onerror = () => {
              console.error('Failed to load logo image')
              URL.revokeObjectURL(objectUrl)
              resolve(qrDataUrl)
            }
            
            logo.src = objectUrl
          })
          .catch(error => {
            console.error('Failed to fetch logo:', error)
            resolve(qrDataUrl)
          })
      } else {
        resolve(qrDataUrl)
      }
    }

    qrImage.onerror = reject
  })
}