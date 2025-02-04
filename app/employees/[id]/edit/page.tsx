'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import React from 'react'
import { Container, Form, Button, ListGroup } from 'react-bootstrap'
import { format } from 'date-fns'
import Header from '@/components/Header'
import { HiTrash, HiDownload, HiDocument } from 'react-icons/hi'

interface Document {
  id: string
  name: string
  path: string
  uploadDate: string
  file?: File
}

interface Employee {
  id: string
  fullName: string
  tcNo: string
  birthDate: string
  sgkNo: string
  startDate: string
  endDate?: string
  isActive: boolean
  phone: string
  documents: Document[]
}

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id as string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/employees/${employeeId}`)
        if (!response.ok) {
          throw new Error('Çalışan bulunamadı')
        }
        const data = await response.json()
        setEmployee(data)
        setDocuments(data.documents || [])
      } catch (error) {
        console.error('Çalışan yükleme hatası:', error)
        setError('Çalışan yüklenirken bir hata oluştu')
      }
    }

    fetchEmployee()
  }, [employeeId])

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
        endDate: formData.get('endDate') || null,
        isActive: (formData.get('isActive') === 'on'),
        documents
      }

      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Çalışan güncellenirken bir hata oluştu')
      }

      router.push('/employees')
    } catch (error: any) {
      console.error('Çalışan güncelleme hatası:', error)
      setError(error.message || 'Çalışan güncellenirken bir hata oluştu')
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    console.log('Selected files:', e.target.files);

    const formData = new FormData();
    Array.from(e.target.files).forEach(file => {
      console.log('Adding file to FormData:', file.name, file.size, 'bytes');
      formData.append('files', file);
    });

    try {
      const uploadUrl = `/api/employees/${employeeId}/files`;
      console.log('Sending request to:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Upload error response:', error);
        throw new Error(error.error || 'Dosya yükleme hatası');
      }

      const result = await response.json();
      console.log('Upload success response:', result);
      
      // API'den dönen dosya adlarını kullan (timestamp'li adlar)
      const newDocs: Document[] = result.files.map((fileName: string) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: fileName, // API'den gelen timestamp'li dosya adını kullan
        path: fileName, // API'den gelen timestamp'li dosya adını kullan
        uploadDate: new Date().toISOString()
      }));

      console.log('Adding new documents to state:', newDocs);
      setDocuments(prev => [...prev, ...newDocs]);

      // Form verilerini güncelle
      const data = {
        ...employee,
        documents: [...documents, ...newDocs]
      };

      // Çalışanı güncelle
      const updateResponse = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Çalışan güncellenirken bir hata oluştu');
      }
      
      // Input'u temizle
      e.target.value = '';
    } catch (error) {
      console.error('File upload error:', error);
      alert('Dosya yüklenirken bir hata oluştu');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find(d => d.id === docId)
    if (!doc) return

    try {
      const response = await fetch(`/api/employees/${employeeId}/files/${encodeURIComponent(doc.name)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Dosya silinirken bir hata oluştu')
      }

      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch (error) {
      console.error('Dosya silme hatası:', error)
      alert('Dosya silinirken bir hata oluştu')
    }
  }

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/files/${encodeURIComponent(doc.name)}`)
      if (!response.ok) {
        throw new Error('Dosya indirilemedi')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name.substring(doc.name.indexOf('-') + 1) // Timestamp'i kaldır
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Dosya indirme hatası:', error)
      alert('Dosya indirilirken bir hata oluştu')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bu çalışanı silmek istediğinize emin misiniz?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Çalışan silinirken bir hata oluştu');
      }

      router.push('/employees');
    } catch (error: any) {
      console.error('Çalışan silme hatası:', error);
      setError(error.message || 'Çalışan silinirken bir hata oluştu');
      setLoading(false);
    }
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Container className="py-4">
          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <div>Yükleniyor...</div>
          )}
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Çalışan Düzenle</h1>
          <div className="d-flex gap-2">
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Siliniyor...' : 'Sil'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => router.push('/employees')}
            >
              Geri Dön
            </Button>
          </div>
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
              defaultValue={employee.fullName}
              placeholder="Çalışanın adı ve soyadını girin"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>TC Kimlik No</Form.Label>
            <Form.Control
              type="text"
              name="tcNo"
              required
              defaultValue={employee.tcNo}
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
              defaultValue={format(new Date(employee.birthDate), 'dd.MM.yyyy')}
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
              defaultValue={employee.sgkNo}
              placeholder="SGK numarasını girin"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Cep Telefonu</Form.Label>
            <Form.Control
              type="tel"
              name="phone"
              required
              defaultValue={employee.phone}
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
              defaultValue={employee.startDate}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>İşten Ayrılma Tarihi</Form.Label>
            <Form.Control
              type="date"
              name="endDate"
              defaultValue={employee.endDate}
            />
            <Form.Text className="text-muted">
              Çalışan işten ayrıldıysa bu alanı doldurun
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="isActive"
              name="isActive"
              label="Aktif Çalışan"
              defaultChecked={employee.isActive}
              onChange={(e) => {
                const isActive = e.target.checked;
                if (!isActive && !employee.endDate) {
                  const today = new Date();
                  const endDateInput = document.querySelector('input[name="endDate"]') as HTMLInputElement;
                  if (endDateInput) {
                    endDateInput.value = format(today, 'yyyy-MM-dd');
                  }
                }
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Belgeler</Form.Label>
            <div className="d-flex gap-2 align-items-center">
              <Form.Control
                type="file"
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
            </div>

            {documents.length > 0 && (
              <ListGroup className="mt-3">
                {documents.map((doc) => (
                  <ListGroup.Item
                    key={doc.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <HiDocument className="text-primary" />
                      <div>
                        <div>{doc.name}</div>
                        <small className="text-muted">
                          {format(new Date(doc.uploadDate), 'dd.MM.yyyy HH:mm')}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      {!doc.file && (
                        <Button
                          variant="link"
                          className="text-primary p-0"
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          <HiDownload size={20} />
                        </Button>
                      )}
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <HiTrash size={20} />
                      </Button>
                    </div>
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