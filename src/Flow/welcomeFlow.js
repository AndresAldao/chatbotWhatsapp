import BotWhatsapp from '@bot-whatsapp/bot';
import { ChatCompletionMessageParam } from 'openai/resources';
import { run, runDetermine } from 'src/services/openai';
import chatbotFlow from './chatbot.flow';

/**
 * Un flujo conversacion que es por defecto cunado no se contgiene palabras claves en otros flujos
 */
export default BotWhatsapp.addKeyword(BotWhatsapp.EVENTS.WELCOME)
    .addAction(function(ctx, flow) {
        try {
            var history = (flow.state.getMyState() && flow.state.getMyState().history) ? flow.state.getMyState().history : [];
            runDetermine(history).then(function(ai) {
                console.log("[QUE QUIERES COMPRAR:", ai.toLowerCase());

                if (ai.toLowerCase().includes('unknown')) {
                    return;
                }

                if (ai.toLowerCase().includes('chatbot')) {
                    return flow.gotoFlow(chatbotFlow);
                }

                /**..... */
            });
        } catch (err) {
            console.log("[ERROR]:", err);
            return;
        }
    })
    .addAction(function(ctx, flow) {
    try {
        var newHistory = (flow.state.getMyState() && flow.state.getMyState().history) ? flow.state.getMyState().history : [];
        var name = ctx.pushName ? ctx.pushName : '';

        console.log("[HISTORY]:", newHistory);

        newHistory.push({
            role: 'user',
            content: ctx.body
        });

        run(name, newHistory).then(function(largeResponse) {
            var chunks = largeResponse.split(/(?<!\d)\.\s+/g);
            chunks.forEach(function(chunk) {
                flow.flowDynamic(chunk);
            });

            newHistory.push({
                role: 'assistant',
                content: largeResponse
            });

            flow.state.update({history: newHistory});
        });
    } catch (err) {
        console.log("[ERROR]:", err);
    }
});
