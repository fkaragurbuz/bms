'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Table, Button } from 'react-bootstrap';
import { HiEye, HiPencil, HiTrash } from 'react-icons/hi';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Header from '@/components/Header';

interface Note {
  id: string;
  customerName: string;
  subject: string;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Notlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Not silinirken bir hata oluştu');
      }

      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Not silme hatası:', error);
      alert('Not silinirken bir hata oluştu');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Notlar</h1>
          <Button
            variant="primary"
            onClick={() => router.push('/notes/add')}
          >
            Yeni Not Ekle
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <Table hover responsive>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3">Müşteri Adı</th>
                <th className="px-4 py-3">Konu</th>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notes.map((note) => (
                <tr key={note.id}>
                  <td className="px-4 py-3">{note.customerName}</td>
                  <td className="px-4 py-3">{note.subject}</td>
                  <td className="px-4 py-3">
                    {format(new Date(note.date), 'dd MMMM yyyy', { locale: tr })}
                  </td>
                  <td className="px-4 py-3">{note.createdBy}</td>
                  <td className="px-4 py-3">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => router.push(`/notes/${note.id}`)}
                      >
                        <HiEye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => router.push(`/notes/${note.id}/edit`)}
                      >
                        <HiPencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(note.id)}
                      >
                        <HiTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {notes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    Henüz not bulunmuyor
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Container>
    </div>
  );
} 