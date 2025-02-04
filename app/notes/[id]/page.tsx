'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Card, ListGroup } from 'react-bootstrap';
import { format } from 'date-fns';
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

export default function ViewNotePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
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
      } catch (error) {
        console.error('Not yükleme hatası:', error);
        alert('Not yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const handleDownloadWord = async () => {
    try {
      const response = await fetch(`/api/notes/${id}/download`);
      if (!response.ok) {
        throw new Error('Word dosyası oluşturulamadı');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Not-${note?.customerName}-${format(new Date(note?.date || ''), 'dd.MM.yyyy')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Word indirme hatası:', error);
      alert('Word dosyası indirilirken bir hata oluştu');
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
          <h1 className="h3 mb-0">Not Detayı</h1>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => router.push('/notes')}
            >
              Geri Dön
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => router.push(`/notes/${params.id}/edit`)}
            >
              Düzenle
            </Button>
            <Button
              variant="outline-success"
              onClick={handleDownloadWord}
            >
              Word İndir
            </Button>
          </div>
        </div>

        <Card>
          <Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Müşteri Adı:</strong> {note.customerName}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Konu:</strong> {note.subject}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Tarih:</strong> {format(new Date(note.date), 'dd.MM.yyyy')}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Oluşturan:</strong> {note.createdBy}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>İçerik:</strong>
                <div className="mt-2 whitespace-pre-wrap">{note.content}</div>
              </ListGroup.Item>
              {note.files && note.files.length > 0 && (
                <ListGroup.Item>
                  <strong>Dosyalar:</strong>
                  <ul className="list-unstyled mt-2">
                    {note.files.map((file, index) => (
                      <li key={index}>
                        <a href={file.path} target="_blank" rel="noopener noreferrer">
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
} 