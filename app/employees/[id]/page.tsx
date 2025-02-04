'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Button, Card, ListGroup } from 'react-bootstrap';
import { format } from 'date-fns';
import { HiDocument } from 'react-icons/hi';
import Header from '@/components/Header';

interface Document {
  id: string;
  name: string;
  path: string;
  uploadDate: string;
}

interface Employee {
  id: string;
  fullName: string;
  tcNo: string;
  birthDate: string;
  sgkNo: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  phone: string;
  documents: Document[];
}

export default function ViewEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/employees/${employeeId}`);
        if (!response.ok) {
          throw new Error('Çalışan bulunamadı');
        }
        const data = await response.json();
        setEmployee(data);
      } catch (error) {
        console.error('Çalışan yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  const handleDownloadFile = async (fileName: string) => {
    try {
      const response = await fetch(`/uploads/${fileName}`);
      if (!response.ok) {
        throw new Error('Dosya indirilemedi');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
      alert('Dosya indirilirken bir hata oluştu');
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

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Container className="py-4">
          <div>Çalışan bulunamadı</div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Çalışan Detayı</h1>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={() => router.push(`/employees/${employeeId}/edit`)}
            >
              Düzenle
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => router.push('/employees')}
            >
              Geri Dön
            </Button>
          </div>
        </div>

        {employee.documents && employee.documents.length > 0 && (
          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">Belgeler</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {employee.documents.map((doc) => (
                <ListGroup.Item
                  key={doc.id}
                  className="d-flex align-items-center gap-2 cursor-pointer"
                  onClick={() => handleDownloadFile(doc.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <HiDocument className="text-primary" />
                  <span className="text-primary">{doc.name}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        )}
      </Container>
    </div>
  );
} 