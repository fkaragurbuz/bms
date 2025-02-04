'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Form, Button, ListGroup } from 'react-bootstrap';
import { format } from 'date-fns';
import { HiX } from 'react-icons/hi';
import Header from '@/components/Header';
import React from 'react';

interface Note {
  id: string;
  customerName: string;
  subject: string;
  date: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  files?: { name: string; path: string; }[];
}

export default function EditNotePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<{ name: string; path: string; }[]>([]);
  const id = params.id;

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await fetch(`/api/notes/${id}`);
        if (!response.ok) {
          throw new Error('Not bulunamadı');
        }
        const data = await response.json();
        setNote(data);
        if (data.files) {
          setExistingFiles(data.files);
        }
      } catch (error) {
        console.error('Not yükleme hatası:', error);
        alert('Not yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      
      // Form verilerini ekle
      formData.append('customerName', (e.currentTarget.elements.namedItem('customerName') as HTMLInputElement).value);
      formData.append('subject', (e.currentTarget.elements.namedItem('subject') as HTMLInputElement).value);
      formData.append('content', (e.currentTarget.elements.namedItem('content') as HTMLTextAreaElement).value);
      formData.append('date', (e.currentTarget.elements.namedItem('date') as HTMLInputElement).value);
      
      // Mevcut dosyaları ekle
      formData.append('existingFiles', JSON.stringify(existingFiles));
      
      // Yeni dosyaları ekle
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Not güncellenirken bir hata oluştu');
      }

      router.push(`/notes/${id}`);
    } catch (error) {
      console.error('Not güncelleme hatası:', error);
      alert('Not güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
    // Input'u temizle ki aynı dosyayı tekrar seçebilsin
    e.target.value = '';
  };

  const handleRemoveNewFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = async (index: number) => {
    try {
      const fileToRemove = existingFiles[index];
      const response = await fetch(`/api/notes/${id}/files/${encodeURIComponent(fileToRemove.name)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Dosya silinirken bir hata oluştu');
      }

      setExistingFiles(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Dosya silme hatası:', error);
      alert('Dosya silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Container className="py-4">
          <div>Yükleniyor...</div>
        </Container>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Container className="py-4">
          <div>Not bulunamadı</div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Not Düzenle</h1>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => router.push(`/notes/${params.id}`)}
            >
              Geri Dön
            </Button>
          </div>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Müşteri Adı</Form.Label>
            <Form.Control
              type="text"
              name="customerName"
              required
              defaultValue={note.customerName}
              placeholder="Müşteri adını girin"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Konu</Form.Label>
            <Form.Control
              type="text"
              name="subject"
              required
              defaultValue={note.subject}
              placeholder="Konu başlığını girin"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tarih</Form.Label>
            <Form.Control
              type="date"
              name="date"
              required
              defaultValue={format(new Date(note.date), 'yyyy-MM-dd')}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>İçerik</Form.Label>
            <Form.Control
              as="textarea"
              name="content"
              required
              defaultValue={note.content}
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
          </Form.Group>

          {/* Mevcut Dosyalar */}
          {existingFiles.length > 0 && (
            <div className="mb-3">
              <strong>Mevcut Dosyalar:</strong>
              <ListGroup className="mt-2">
                {existingFiles.map((file, index) => (
                  <ListGroup.Item key={index} className="d-flex align-items-center gap-2">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="p-1"
                      onClick={() => handleRemoveExistingFile(index)}
                    >
                      <HiX className="w-4 h-4" />
                    </Button>
                    <span>{file.name}</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          {/* Yeni Seçilen Dosyalar */}
          {files.length > 0 && (
            <div className="mb-3">
              <strong>Yeni Dosyalar:</strong>
              <ListGroup className="mt-2">
                {files.map((file, index) => (
                  <ListGroup.Item key={index} className="d-flex align-items-center gap-2">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="p-1"
                      onClick={() => handleRemoveNewFile(index)}
                    >
                      <HiX className="w-4 h-4" />
                    </Button>
                    <span>{file.name}</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              variant="outline-secondary"
              onClick={() => router.push(`/notes/${params.id}`)}
            >
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              Kaydet
            </Button>
          </div>
        </Form>
      </Container>
    </div>
  );
} 