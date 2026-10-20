# Google OAuth2 + RBAC

Atividade 2 de DCC075: login com Google (OAuth2) e autorização por papéis (RBAC).

## Rodando

Preencha o `.env` com as credenciais do Google (redirect: `http://localhost:3000/callback`) e rode:

```bash
bun install
bun start
```

Acesse http://localhost:3000 e clique em **Login com Google**.

## Testando o RBAC

O papel é definido pelo e-mail que o Google devolve no login. A lista fica em `src/rbac.js`:

| e-mail | papel |
| --- | --- |
| lucas@exemplo.com | paciente |
| mariana@exemplo.com | enfermeiro |
| roberto@exemplo.com | medico |

Como esses e-mails não são seus, troque um deles pelo e-mail da sua conta:

```js
export const USUARIOS = new Map([
  ['seu.email@gmail.com', { nome: 'Seu Nome', papel: 'medico' }],
  // ...
]);
```

Reinicie o servidor e faça login de novo. Na página aparecem o seu papel e uma tabela dizendo o que ele pode fazer.

Resultado esperado:

- paciente: só ver histórico
- enfermeiro: histórico, medir sinais e aplicar medicamento
- medico: todas as ações
- e-mail não cadastrado: visitante, tudo negado

Para testar outro papel, troque o `papel` no `src/rbac.js` e entre novamente.
