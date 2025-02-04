'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Form, Button, ListGroup } from 'react-bootstrap'
import { format, subYears } from 'date-fns'
import Header from '@/components/Header'
import { HiTrash, HiUpload } from 'react-icons/hi'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

interface Document {
  id: string
  name: string
  path: string
  uploadDate: string
}

export default function AddEmployeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      
      // Tarihi kontrol et
      const birthDateStr = formData.get('birthDate') as string
      const [day, month, year] = birthDateStr.split('.')
      const birthDate = new Date(Number(year), Number(month) - 1, Number(day))
      
      // Geçerli tarih kontrolü
      if (isNaN(birthDate.getTime())) {
        throw new Error('Geçerli bir doğum tarihi giriniz')
      }

      // Yaş kontrolü (en az 18 yaş)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (age < 18 || (age === 18 && monthDiff < 0)) {
        throw new Error('Çalışan 18 yaşından büyük olmalıdır')
      }

      const data = {
        fullName: formData.get('fullName'),
        tcNo: formData.get('tcNo'),
        birthDate: format(birthDate, 'yyyy-MM-dd'),
        sgkNo: formData.get('sgkNo'),
        startDate: formData.get('startDate'),
        phone: formData.get('phone'),
        isActive: true,
        documents: documents
      }

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Çalışan eklenirken bir hata oluştu')
      }

      router.push('/employees')
    } catch (error: any) {
      console.error('Çalışan ekleme hatası:', error)
      setError(error.message || 'Çalışan eklenirken bir hata oluştu')
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const formData = new FormData()
    Array.from(e.target.files).forEach(file => {
      formData.append('files', file)
    })

    try {
      // Dosyaları yükle
      const uploadResponse = await fetch(`/api/employees/files`, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Dosya yükleme hatası')
      }

      const result = await uploadResponse.json()
      
      const newDocs: Document[] = result.files.map((fileName: string) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: fileName,
        path: fileName,
        uploadDate: new Date().toISOString()
      }))

      setDocuments(prev => [...prev, ...newDocs])
      
      // Input'u temizle
      e.target.value = ''
    } catch (error) {
      console.error('Dosya yükleme hatası:', error)
      alert('Dosya yüklenirken bir hata oluştu')
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId)
    if (!doc) return

    try {
      const response = await fetch(`/api/employees/files/${doc.path}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Dosya silinemedi')
      }

      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch (error) {
      console.error('Dosya silme hatası:', error)
      alert('Dosya silinirken bir hata oluştu')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Yeni Çalışan Ekle</h1>
          <Button
            variant="outline-secondary"
            onClick={() => router.push('/employees')}
          >
            Geri Dön
          </Button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Adı Soyadı</Form.Label>
            <Form.Control
              type="text"
              name="fullName"
              required
              placeholder="Çalışanın adı ve soyadını girin"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>TC Kimlik No</Form.Label>
            <Form.Control
              type="text"
              name="tcNo"
              required
              minLength={11}
              maxLength={11}
              placeholder="11 haneli TC kimlik numarasını girin"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Doğum Tarihi</Form.Label>
            <Form.Control
              type="text"
              name="birthDate"
              required
              placeholder="GG.AA.YYYY"
              pattern="\d{2}\.\d{2}\.\d{4}"
              maxLength={10}
            />
            <Form.Text className="text-muted">
              Örnek: 15.04.1990
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>SGK No</Form.Label>
            <Form.Control
              type="text"
              name="sgkNo"
              required
              placeholder="SGK numarasını girin"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Cep Telefonu</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              required
              placeholder="05XX XXX XX XX"
              pattern="[0-9]{11}"
              minLength={11}
              maxLength={11}
            />
            <Form.Text className="text-muted">
              Başında 0 olmak üzere 11 haneli telefon numarası
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>İşe Başlama Tarihi</Form.Label>
            <Form.Control
              type="date"
              name="startDate"
              required
              defaultValue={format(new Date(), 'yyyy-MM-dd')}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Belgeler</Form.Label>
            <div className="d-flex gap-2 align-items-center">
              <Form.Control
                type="file"
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="flex-grow-1"
              />
              <div className="text-muted small">
                (PDF, Word, Resim)
              </div>
            </div>

            {documents.length > 0 && (
              <ListGroup className="mt-3">
                {documents.map((doc) => (
                  <ListGroup.Item
                    key={doc.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <HiUpload className="text-primary" />
                      <div>
                        <div>{doc.name}</div>
                        <small className="text-muted">
                          {format(new Date(doc.uploadDate), 'dd.MM.yyyy HH:mm')}
                        </small>
                      </div>
                    </div>
                    <Button
                      variant="link"
                      className="text-danger p-0"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <HiTrash size={20} />
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => router.push('/employees')}
            >
              İptal
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </Form>
      </Container>
    </div>
  )
} 