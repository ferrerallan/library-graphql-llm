import { createClient } from 'graphql-ws';
import WebSocket from 'ws';
import * as dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

// Interface para representar um autor
interface Author {
  id: number;
  name: string;
  email: string;
}

async function startWatcher() {
  console.log('📡 Starting Library Watcher...');

  // Cria um cliente WebSocket para GraphQL
  const client = createClient({
    url: process.env.GRAPHQL_WS_URL || 'ws://localhost:4000/graphql',
    webSocketImpl: WebSocket,
    connectionParams: {
      // Aqui você pode adicionar headers de autenticação se necessário
    },
    on: {
      connected: () => console.log('🔌 Connected to GraphQL WebSocket'),
      closed: () => console.log('🔌 Disconnected from GraphQL WebSocket'),
    },
  });

  // Define a subscription para novos autores
  const subscription = {
    query: `
      subscription {
        newAuthor {
          id
          name
          email
        }
      }
    `,
  };

  console.log('👂 Listening for new authors...');

  // Inicia a subscription
  const unsubscribe = client.subscribe(
    subscription,
    {
      next: (data: any) => {
        const author: Author = data.data.newAuthor;
        console.log('\n📚 New Author Detected!');
        console.log('------------------');
        console.log(`ID: ${author.id}`);
        console.log(`Name: ${author.name}`);
        console.log(`Email: ${author.email}`);
        console.log('------------------\n');
      },
      error: (error) => {
        console.error('❌ Subscription error:', error);
      },
      complete: () => {
        console.log('✅ Subscription completed');
      },
    },
  );

  // Gerenciamento de processo
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down watcher...');
    unsubscribe();
    process.exit(0);
  });
}

// Inicia o observador com tratamento de erros
startWatcher().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});