import { useState, useRef } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import Modal from 'react-modal'
import { User, Upload } from 'lucide-react'

// Import styles
import 'react-image-crop/dist/ReactCrop.css'

// Set app element for accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement('body')
}

// --- Helper Function: Generate Cropped Image ---
function getCroppedImg(image, crop, fileName) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }
      const file = new File([blob], fileName, { type: blob.type })
      resolve(file)
    }, 'image/jpeg')
  })
}

export default function ImageUploader({ 
  currentImage, 
  onImageChange, 
  label = "Profile Picture", 
  editable = true 
}) {
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(currentImage)
  const [modalIsOpen, setModalIsOpen] = useState(false)
  const imgRef = useRef(null)

  // 1. Select File
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setImageFile(file)
      setCrop(undefined)
      const reader = new FileReader()
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''))
      reader.readAsDataURL(file)
      setModalIsOpen(true)
    }
  }

  // 2. Load Image for Cropping
  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1 / 1, width, height),
      width,
      height
    )
    setCrop(crop)
  }

  // 3. Complete Crop
  const handleCropComplete = async () => {
    if (completedCrop && imgRef.current && imageFile) {
      try {
        const croppedFile = await getCroppedImg(imgRef.current, completedCrop, imageFile.name)
        const newPreview = URL.createObjectURL(croppedFile)
        
        setPreviewUrl(newPreview)
        onImageChange(croppedFile) // Send file to parent
        setModalIsOpen(false)
      } catch (e) {
        console.error('Error cropping image:', e)
      }
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onImageChange(null)
    setImgSrc('')
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center space-x-4">
        {/* Preview Circle */}
        <div className="flex-shrink-0">
          {previewUrl ? (
            <img
              className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
              src={previewUrl}
              alt="Profile preview"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 border-dashed">
              <User className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Controls */}
        {editable && (
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
              <Upload size={16} className="mr-2 text-gray-500" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onSelectFile}
              />
            </label>
            
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Crop Image"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75 z-50"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Adjust Profile Picture</h2>
        <div className="max-h-[60vh] overflow-auto rounded-lg bg-gray-100 flex justify-center">
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop preview" />
            </ReactCrop>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setModalIsOpen(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCropComplete}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
          >
            Apply
          </button>
        </div>
      </Modal>
    </div>
  )
}