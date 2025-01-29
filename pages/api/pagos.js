import { supabase } from '../../config/supabaseClient';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { egresado_id, fecha_pago, monto, recibio, tipo_pago } = req.body;
        
        const { data, error } = await supabase.from('pagos').insert([
            { egresado_id, fecha_pago, monto, recibio, tipo_pago }
        ]);
        
        if (error) return res.status(400).json({ error: error.message });

        // Actualizar egresados: pagos_realizados y dia_pago
        const { error: updateError } = await supabase
            .from('egresados')
            .update({ pagos_realizados: supabase.raw('pagos_realizados + 1'), dia_pago: fecha_pago })
            .eq('id', egresado_id);
        
        if (updateError) return res.status(400).json({ error: updateError.message });

        res.status(200).json({ message: 'Pago registrado y egresado actualizado' });
    }
}