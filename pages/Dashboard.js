import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FaUserPlus, FaCreditCard, FaSignOutAlt, FaList } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function Dashboard({ handleLogout }) {
  const [loading, setLoading] = useState(false);
  const [egresados, setEgresados] = useState([]);
  const [newEgresado, setNewEgresado] = useState({
    nombre: '',
    fecha_egreso: '',
    cuota_seguimiento: '',
    dia_pago: ''
  });
  const [paymentData, setPaymentData] = useState({
    egresado_id: '',
    fecha_pago: '',
    monto: '',
    recibio: '',
    tipo_pago: ''
  });
  const [section, setSection] = useState('egresados');

  useEffect(() => {
    const fetchEgresados = async () => {
      const { data, error } = await supabase.from('egresados').select('*');
      if (error) {
        console.error(error);
      } else {
        setEgresados(data);
        console.log('Egresados:', data);  // Verificar si los egresados se están obteniendo correctamente
      }
    };
    fetchEgresados();
  }, []);

  const handleAddEgresado = async () => {
    const { error } = await supabase.from('egresados').insert([newEgresado]);
    if (!error) {
      alert('Egresado agregado');
      setEgresados([...egresados, newEgresado]);
      setNewEgresado({ nombre: '', fecha_egreso: '', cuota_seguimiento: '', dia_pago: '' });
      setSection('egresados');
    }
  };

  const handleRegistrarPago = async () => {
    // Primero, inserta el nuevo pago en la tabla 'pagos'
    const { error: insertPagoError } = await supabase.from('pagos').insert([paymentData]);
    if (insertPagoError) {
      console.error('Error al registrar el pago:', insertPagoError);
      return;
    }

    // Obtiene el egresado que hizo el pago
    const egresadoId = paymentData.egresado_id;

    // Obtiene la información actual del egresado
    const { data: egresado, error: getEgresadoError } = await supabase
      .from('egresados')
      .select('id, dia_pago, pagos_realizados')
      .eq('id', egresadoId)
      .single();

    if (getEgresadoError) {
      console.error('Error al obtener egresado:', getEgresadoError);
      return;
    }

    // Actualiza el 'dia_pago' sumándole 1 mes
    const newDiaPago = new Date(egresado.dia_pago);
    newDiaPago.setMonth(newDiaPago.getMonth() + 1);

    // Incrementa el contador de 'pagos_realizados'
    const newPagosRealizados = egresado.pagos_realizados + 1;

    // Ahora actualiza la tabla 'egresados' con los nuevos valores
    const { error: updateEgresadoError } = await supabase
      .from('egresados')
      .update({
        dia_pago: newDiaPago.toISOString().split('T')[0], // Formato de fecha YYYY-MM-DD
        pagos_realizados: newPagosRealizados,
      })
      .eq('id', egresadoId);

    if (updateEgresadoError) {
      console.error('Error al actualizar el egresado:', updateEgresadoError);
    } else {
      alert('Pago registrado y datos actualizados correctamente');
      setPaymentData({
        egresado_id: '',
        fecha_pago: '',
        monto: '',
        recibio: '',
        tipo_pago: '',
      });
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-blue-800 p-4 rounded-lg shadow-lg mb-6 flex justify-center space-x-4">
        <Button onClick={() => setSection('egresados')} className="bg-green-700"><FaList /></Button>
        <Button onClick={() => setSection('nuevoEgresado')} className="bg-green-700"><FaUserPlus /></Button>
        <Button onClick={() => setSection('registrarPago')} className="bg-blue-600"><FaCreditCard /></Button>
        <Button onClick={handleLogout} className="bg-red-600"><FaSignOutAlt /></Button>
      </div>

      <div className="max-w-4xl mx-auto">
        {section === 'egresados' && (

          <div>
            <h2>Egresados</h2>
            {egresados.length > 0 ? (
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b text-left">Nombre</th>
                    <th className="px-4 py-2 border-b text-left">Próximo Día de Pago</th>
                    <th className="px-4 py-2 border-b text-left">Cuota de Seguimiento</th>
                    <th className="px-4 py-2 border-b text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {egresados.map((egresado) => {
                    const fechaPago = new Date(egresado.dia_pago);
                    const fechaHoy = new Date();

                    // Calcula la diferencia de días
                    const diferenciaDias = Math.ceil((fechaPago - fechaHoy) / (1000 * 3600 * 24));

                    // Formato de la fecha en "25 de Enero del 2025"
                    const fechaLocal = new Date(fechaPago.toLocaleString('en-US', { timeZone: 'UTC' }));

                    // Ahora formateamos la fecha de la manera que quieres
                    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
                    const fechaFormateada = fechaLocal.toLocaleDateString('es-MX', opciones);

                    // Separar la fecha para darle el formato adecuado
                    const [dia, mes, anio] = fechaFormateada.split(" ");
                    const fechaFinal = `${dia} ${mes} ${anio}`;

                    // Asignar clase según la diferencia de días
                    const fechaClass = diferenciaDias <= 7 ? 'text-red-600' : 'text-green-600';


                    const handleShowReport = async (id) => {
                      try {
                        // Obtener los pagos de la base de datos usando Supabase
                        const { data, error } = await supabase
                          .from('pagos')
                          .select('*')
                          .eq('egresado_id', id);

                        if (error) {
                          console.error('Error fetching pagos:', error);
                          return;
                        }

                        // Obtener los datos del egresado desde la lista ya cargada
                        const egresado = egresados.find((e) => e.id === id);

                        // Generar el PDF
                        const doc = new jsPDF();

                        // Estilo de Título
                        doc.setFontSize(20);
                        doc.setFont('helvetica', 'bold');
                        doc.text('Reporte de Pagos', 14, 20);

                        // Información del egresado
                        doc.setFontSize(14);
                        doc.setFont('helvetica', 'normal');
                        doc.text(`Nombre: ${egresado.nombre}`, 14, 35);
                        doc.text(`Fecha de Egreso: ${egresado.fecha_egreso}`, 14, 45);
                        doc.text(`Proximo Día de Pago: ${egresado.dia_pago}`, 14, 55);
                        doc.text(`Cuota: $${egresado.cuota_seguimiento}`, 14, 65);

                        // Calcular el monto total que debería haberse pagado
                        const totalEsperado = egresado.cuota_seguimiento * data.length;

                        // Calcular el total pagado
                        const totalPagado = data.reduce((sum, pago) => sum + pago.monto, 0);

                        // Calcular el adeudo (si el total pagado es menor al total esperado)
                        const adeudo = totalEsperado > totalPagado ? totalEsperado - totalPagado : 0;

                        // Espacio antes de la tabla
                        let y = 75;
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');

                        // Tabla de pagos
                        const tableData = data.map((pago) => [
                          pago.fecha_pago,               // Fecha de pago
                          `$${pago.monto}`,
                          pago.recibio,
                          pago.tipo_pago,            // Monto del pago
                        ]);

                        // Estilo de la tabla
                        doc.autoTable({
                          head: [['Fecha de Pago', 'Monto', 'Recibió', 'Tipo de Pago']],
                          body: tableData,
                          startY: y,
                          theme: 'grid', // Usa un estilo limpio y simple
                          headStyles: {
                            fillColor: [220, 220, 220], // Color suave de fondo para los encabezados
                            textColor: [0, 0, 0], // Color de texto negro
                            fontStyle: 'bold', // Títulos en negrita
                          },
                          bodyStyles: {
                            fillColor: [255, 255, 255], // Fondo blanco para las celdas
                            textColor: [0, 0, 0], // Texto en color negro
                          },
                          styles: {
                            font: 'helvetica', // Aplicamos la fuente Helvetica
                            fontSize: 12,
                            cellPadding: 6, // Ajuste de espaciado de celdas
                          },
                        });

                        // Mostrar el adeudo
                        doc.setFontSize(14);
                        doc.setFont('helvetica', 'bold');
                        doc.text(`Total Pagado: $${totalPagado}`, 14, doc.autoTable.previous.finalY + 10);
                        doc.text(`Total Esperado: $${totalEsperado}`, 14, doc.autoTable.previous.finalY + 20);

                        // Si hay adeudo, lo mostramos
                        if (adeudo > 0) {
                          doc.text(`Adeudo: $${adeudo}`, 14, doc.autoTable.previous.finalY + 30);
                        } else {
                          doc.text('No hay adeudo.', 14, doc.autoTable.previous.finalY + 30);
                        }

                        const pdfBlob = doc.output('blob');
                        const pdfUrl = URL.createObjectURL(pdfBlob);
                        window.open(pdfUrl, '_blank');

                      } catch (error) {
                        console.error('Error al generar el reporte:', error);
                      }
                    };




                    //Eliminar

                    const handleEliminar = async () => {
                      const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar a este egresado?");

                      if (confirmDelete) {
                        const { error } = await supabase.from('egresados').delete().eq('id', egresado.id);
                        if (error) {
                          console.error('Error al eliminar egresado:', error);
                        } else {
                          alert('Egresado eliminado');
                          setEgresados(egresados.filter(e => e.id !== egresado.id));
                        }
                      } else {
                        alert('La eliminación ha sido cancelada.');
                      }
                    };


                    return (
                      <tr key={egresado.id}>
                        <td className="px-4 py-2 border-b">{egresado.nombre}</td>
                        <td className={`px-4 py-2 border-b font-bold text-center ${fechaClass}`}>{fechaFinal}</td>
                        <td className="px-4 py-2 border-b font-semibold">${egresado.cuota_seguimiento} MXN</td>
                        <td className="px-4 py-2 border-b flex space-x-2">
                          <Button
                            onClick={() => handleShowReport(egresado.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                            disabled={loading}
                          >
                            {loading ? 'Generando...' : 'Reporte'}
                          </Button>

                          <Button onClick={handleEliminar} className="bg-red-600 text-white px-4 py-2 rounded">Eliminar</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>No hay egresados disponibles.</p>
            )}
          </div>

        )}

        {section === 'nuevoEgresado' && (
          <Card className="bg-white shadow-md rounded-lg p-6">
            <CardContent>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Nuevo Egresado</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={newEgresado.nombre}
                  onChange={(e) => setNewEgresado({ ...newEgresado, nombre: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div>
                  <label htmlFor="fecha_egreso" className="block text-sm font-medium text-gray-700 mb-2">Fecha de Egreso</label>
                  <input
                    id="fecha_egreso"
                    type="date"
                    value={newEgresado.fecha_egreso}
                    onChange={(e) => setNewEgresado({ ...newEgresado, fecha_egreso: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <input
                  type="number"
                  placeholder="Cuota de Seguimiento"
                  value={newEgresado.cuota_seguimiento}
                  onChange={(e) => setNewEgresado({ ...newEgresado, cuota_seguimiento: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div>
                  <label htmlFor="fecha_egreso" className="block text-sm font-medium text-gray-700 mb-2">Dia de Pago</label>
                  <input
                    type="date"
                    placeholder="Día de Pago"
                    value={newEgresado.dia_pago}
                    onChange={(e) => setNewEgresado({ ...newEgresado, dia_pago: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

              </div>
              <Button
                onClick={handleAddEgresado}
                className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Agregar Egresado
              </Button>
            </CardContent>
          </Card>

        )}

        {section === 'registrarPago' && (
          <Card className="bg-white shadow-lg rounded-lg p-6 max-w-lg mx-auto">
            <CardContent>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Registrar Pago</h2>

              <div className="space-y-6">
                {/* Selección del egresado */}
                <div>
                  <label htmlFor="egresado_id" className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Egresado</label>
                  <select
                    id="egresado_id"
                    value={paymentData.egresado_id}
                    onChange={(e) => setPaymentData({ ...paymentData, egresado_id: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccione un egresado</option>
                    {egresados.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha de Pago */}
                <div>
                  <label htmlFor="fecha_pago" className="block text-sm font-medium text-gray-700 mb-2">Fecha de Pago</label>
                  <input
                    id="fecha_pago"
                    type="date"
                    value={paymentData.fecha_pago}
                    onChange={(e) => setPaymentData({ ...paymentData, fecha_pago: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Monto */}
                <div>
                  <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                  <input
                    id="monto"
                    type="number"
                    placeholder="Monto"
                    value={paymentData.monto}
                    onChange={(e) => setPaymentData({ ...paymentData, monto: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Recibió */}
                <div>
                  <label htmlFor="recibio" className="block text-sm font-medium text-gray-700 mb-2">Recibió</label>
                  <input
                    id="recibio"
                    type="text"
                    placeholder="Recibió"
                    value={paymentData.recibio}
                    onChange={(e) => setPaymentData({ ...paymentData, recibio: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Tipo de Pago */}
                <div>
                  <label htmlFor="tipo_pago" className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pago</label>
                  <input
                    id="tipo_pago"
                    type="text"
                    placeholder="Tipo de Pago"
                    value={paymentData.tipo_pago}
                    onChange={(e) => setPaymentData({ ...paymentData, tipo_pago: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Botón */}
                <Button
                  onClick={handleRegistrarPago}
                  className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Registrar Pago
                </Button>
              </div>
            </CardContent>
          </Card>

        )}
      </div>
    </div>
  );
}
