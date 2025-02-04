'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Form, Button } from 'react-bootstrap';
import { format } from 'date-fns';
import { HiX } from 'react-icons/hi';
import Header from '@/components/Header';

export default function AddNotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Kullanıcı bilgisini ekle
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        formData.append('createdBy', user.email);
      }

      // Dosyaları ekle
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/notes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Not eklenirken bir hata oluştu');
      }

      router.push('/notes');
    } catch (error) {
      console.error('Not ekleme hatası:', error);
      alert('Not eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
    // Input'u temizle ki aynı dosyayı tekrar seçebilsin
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Yeni Not Ekle</h1>
          <Button
            variant="outline-secondary"
            onClick={() => router.push('/notes')}
          >
            Geri Dön
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Müşteri Adı</Form.Label>
              <Form.Control
                type="text"
                name="customerName"
                required
                placeholder="Müşteri adını girin"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Konu</Form.Label>
              <Form.Control
                type="text"
                name="subject"
                required
                placeholder="Konu başlığını girin"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tarih</Form.Label>
              <Form.Control
                type="date"
                name="date"
                required
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>İçerik</Form.Label>
              <Form.Control
                as="textarea"
                name="content"
                required
                rows={5}
                placeholder="Not içeriğini girin"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dosyalar</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              <Form.Text className="text-muted">
                Birden fazla dosya seçebilirsiniz
              </Form.Text>
              {files.length > 0 && (
                <div className="mt-2">
                  <strong>Seçilen dosyalar:</strong>
                  <ul className="list-unstyled">
                    {files.map((file, index) => (
                      <li key={index} className="d-flex align-items-center gap-2 mt-1">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="p-1"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <HiX className="w-4 h-4" />
                        </Button>
                        <span>{file.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => router.push('/notes')}
                disabled={loading}
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
        </div>
      </Container>
    </div>
  );
} 