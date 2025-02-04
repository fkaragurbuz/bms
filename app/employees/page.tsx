'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Card, Badge, Nav } from 'react-bootstrap';
import { format } from 'date-fns';
import Header from '@/components/Header';

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
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) {
          throw new Error('Çalışanlar yüklenirken bir hata oluştu');
        }
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Çalışanlar yükleme hatası:', error);
        alert('Çalışanlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(employee => 
    activeTab === 'active' ? employee.isActive : !employee.isActive
  );

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
          <h1 className="h3 mb-0">Çalışanlar</h1>
          <Button
            variant="primary"
            onClick={() => router.push('/employees/add')}
          >
            Yeni Çalışan Ekle
          </Button>
        </div>

        <Nav
          variant="tabs"
          className="mb-4"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k as 'active' | 'inactive')}
        >
          <Nav.Item>
            <Nav.Link eventKey="active">
              Aktif Çalışanlar ({employees.filter(e => e.isActive).length})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="inactive">
              Ayrılan Çalışanlar ({employees.filter(e => !e.isActive).length})
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/employees/${employee.id}/edit`)}
            >
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title mb-0">{employee.fullName}</h5>
                  <Badge bg={employee.isActive ? 'success' : 'danger'}>
                    {employee.isActive ? 'Aktif' : 'Ayrıldı'}
                  </Badge>
                </div>
                <div className="text-muted mb-2">
                  <small>TC: {employee.tcNo}</small>
                </div>
                <div className="text-muted mb-2">
                  <small>SGK No: {employee.sgkNo}</small>
                </div>
                <div className="text-muted mb-2">
                  <small>Telefon: {employee.phone}</small>
                </div>
                <div className="text-muted mb-2">
                  <small>Doğum Tarihi: {format(new Date(employee.birthDate), 'dd.MM.yyyy')}</small>
                </div>
                <div className="text-muted">
                  <small>İşe Başlama: {format(new Date(employee.startDate), 'dd.MM.yyyy')}</small>
                </div>
                {employee.endDate && (
                  <div className="text-muted">
                    <small>İşten Ayrılış: {format(new Date(employee.endDate), 'dd.MM.yyyy')}</small>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">
              {activeTab === 'active' ? 'Aktif çalışan bulunmuyor' : 'Ayrılan çalışan bulunmuyor'}
            </p>
          </div>
        )}
      </Container>
    </div>
  );
} 