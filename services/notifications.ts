export interface AlertPayload {
    title: string;
    source: string;
    province: string;
    emotion: string;
    impactScore: number;
    summary: string;
}

/**
 * Sends a crisis alert to n8n which then forwards it to Telegram.
 * Uses the user's n8n-testing instance.
 */
export const sendTelegramAlert = async (alert: AlertPayload) => {
    const N8N_WEBHOOK_URL = 'https://n8n-test.partidosomosjujuy.cloud/webhook/afecto-diario-alert';

    console.log('🚀 Enviando alerta de crisis a n8n/Telegram...', alert);

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...alert,
                timestamp: new Date().toISOString(),
                maia_msg: `¡Hola! Detecté una crisis social en ${alert.province}. El tema "${alert.title}" tiene un impacto de ${alert.impactScore}/100.`
            }),
        });

        if (!response.ok) {
            throw new Error(`Error en el webhook: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error('❌ Error al enviar alerta a Telegram:', error);
        return false;
    }
};
