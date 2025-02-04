const employees = [
  { name: "Ahmet Yılmaz" },
  { name: "Mehmet Demir" },
  { name: "Ayşe Kaya" },
  { name: "Fatma Çelik" },
  { name: "Ali Öztürk" },
  { name: "Zeynep Yıldız" },
  { name: "Mustafa Şahin" },
  { name: "Emine Arslan" },
  { name: "Hüseyin Aydın" },
  { name: "Hatice Özdemir" }
];

async function addEmployees() {
  for (const employee of employees) {
    try {
      const response = await fetch('http://localhost:3000/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employee),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Added employee: ${employee.name}`);
    } catch (error) {
      console.error(`Error adding employee ${employee.name}:`, error);
    }
  }
}

addEmployees(); 