// Para depurar en la consola del navegador
// Copia y pega esto en la consola cuando estés en la página de asignaciones

// 1. Verificar qué grados está cargando el frontend
console.log('Grados cargados:', window.grades || 'No disponible');

// 2. Verificar el ordenamiento
fetch('https://rizddhhcqbmbvnborjlc.supabase.co/rest/v1/grades?select=id,name&order=name.asc', {
  headers: {
    'apikey': 'TU_ANON_KEY',
    'Authorization': 'Bearer TU_ANON_KEY'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Grados desde API:', data);
  
  // Verificar si Preescolar está en los datos
  const preescolar = data.find(g => g.name.toLowerCase().includes('preescolar'));
  console.log('Preescolar encontrado:', preescolar);
  
  // Verificar ordenamiento
  console.log('Orden actual:', data.map(g => g.name));
})
.catch(error => console.error('Error:', error));
