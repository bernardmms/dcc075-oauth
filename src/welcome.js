import { ACOES, PAPEIS, temPermissao } from './rbac.js';

// escapa o texto pra não virar HTML/script na página
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// monta a página autenticada com o papel do usuário e o resultado do controle de acesso
export function renderizarBoasVindas({ nome, email, papel }) {
  const descricaoPapel = PAPEIS[papel]?.descricao ?? papel;

  // uma linha pra cada ação, dizendo se o papel atual pode ou não
  const linhas = ACOES.map((acao) => {
    const permitido = temPermissao(papel, acao.id);
    const status = permitido
      ? '<span class="ok">Permitido</span>'
      : '<span class="negado">Negado</span>';

    return `
      <tr>
        <td>${escapeHtml(acao.descricao)}</td>
        <td><code>${escapeHtml(acao.id)}</code></td>
        <td>${status}</td>
      </tr>`;
  }).join('');

  // permissões que o papel atual tem
  const permitidas = [...(PAPEIS[papel]?.permissoes ?? [])];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; }
    .ok { color: #1a7f37; font-weight: 600; }
    .negado { color: #b42318; font-weight: 600; }
    .papel { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; background: #eef2ff; }
    code { background: #f4f4f4; padding: 0.1rem 0.25rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Bem-vindo, ${escapeHtml(nome)}!</h1>
  <p>Seu e-mail: ${escapeHtml(email)}</p>
  <p>Seu papel (RBAC): <span class="papel">${escapeHtml(descricaoPapel)}</span></p>
  <p>Permissões: <code>${permitidas.length ? escapeHtml(permitidas.join(', ')) : 'nenhuma'}</code></p>

  <h2>Controle de acesso</h2>
  <table>
    <thead>
      <tr><th>Ação</th><th>Permissão</th><th>Resultado</th></tr>
    </thead>
    <tbody>${linhas}
    </tbody>
  </table>

  <p><a href="/logout">Sair</a></p>
</body>
</html>`;
}
