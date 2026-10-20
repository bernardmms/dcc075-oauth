import path from 'node:path';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { obterPapel } from './rbac.js';
import { renderizarBoasVindas } from './welcome.js';

// carrega as variáveis do .env
dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

// se faltar credencial, avisa e nem sobe o servidor
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.error(
    'Variáveis de ambiente ausentes. Preencha GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI no arquivo .env.'
  );
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

app.use(
  express.static(path.join(import.meta.dir, '..', 'public'), { index: false })
);

// 1. Sessões guardadas na memória do servidor (zera quando reinicia).
// O papel fica aqui e não na URL, senão o usuário poderia trocar o próprio papel.
const sessoes = new Map();
const SESSAO_TTL_MS = 60 * 60 * 1000;

// cria a sessão e devolve o id que vai no cookie
function criarSessao(dados) {
  const id = randomUUID();
  sessoes.set(id, { ...dados, expiraEm: Date.now() + SESSAO_TTL_MS });
  return id;
}

// pega um cookie do cabeçalho da requisição
function lerCookie(req, nome) {
  const cookies = req.headers.cookie ?? '';

  for (const item of cookies.split(';')) {
    const [chave, ...resto] = item.trim().split('=');
    if (chave === nome) return decodeURIComponent(resto.join('='));
  }

  return undefined;
}

// busca a sessão pelo cookie e confere se ainda não venceu
function obterSessao(req) {
  const id = lerCookie(req, 'sid');
  if (!id) return undefined;

  const sessao = sessoes.get(id);
  if (!sessao) return undefined;

  if (sessao.expiraEm < Date.now()) {
    sessoes.delete(id);
    return undefined;
  }

  return sessao;
}

// de tempo em tempo limpa as sessões vencidas
setInterval(() => {
  const agora = Date.now();
  for (const [id, sessao] of sessoes) {
    if (sessao.expiraEm < agora) sessoes.delete(id);
  }
}, 10 * 60 * 1000);

// página inicial: gera o link de login do Google
app.get('/', (req, res) => {
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile', 'openid'],
  });

  res.send(`<a href="${url}">Login com Google</a>`);
});

// o Google volta pra cá depois que o usuário autoriza
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (typeof code !== 'string') {
    res.status(400).send('Código de autorização ausente.');
    return;
  }

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    if (!tokens.id_token) {
      throw new Error('O Google não retornou um ID token.');
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Não foi possível obter os dados do usuário.');
    }

    const nome = payload.name ?? '';
    const email = payload.email ?? '';

    // 2. RBAC: o e-mail vem do token já verificado, então dá pra confiar nele
    const papel = obterPapel(email);
    console.log(`Usuário autenticado: ${email} -> papel: ${papel}`);

    // guarda nome, e-mail e papel na sessão e manda só o id no cookie
    const sessaoId = criarSessao({ nome, email, papel });

    res.cookie('sid', sessaoId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSAO_TTL_MS,
    });

    res.redirect('/welcome');
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).send('Erro ao autenticar com o Google.');
  }
});

// página autenticada: sem sessão, volta pro login
app.get('/welcome', (req, res) => {
  const sessao = obterSessao(req);

  if (!sessao) {
    res.redirect('/');
    return;
  }

  res.send(renderizarBoasVindas(sessao));
});

// logout: apaga a sessão e o cookie
app.get('/logout', (req, res) => {
  const sessaoId = lerCookie(req, 'sid');

  if (sessaoId) {
    sessoes.delete(sessaoId);
  }

  res.clearCookie('sid');
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
