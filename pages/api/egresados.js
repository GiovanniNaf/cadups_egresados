import { supabase } from '@/utils/supabase.js';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { nombre, fecha_egreso, cuota_seguimiento } = req.body;
        const { data, error } = await supabase.from('egresados').insert([
            { nombre, fecha_egreso, cuota_seguimiento, pagos_realizados: 0, dia_pago: null }
        ]);
        if (error) return res.status(400).json({ error: error.message });
        res.status(200).json(data);
    }
}