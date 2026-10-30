const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3000;

// Conexão com o MongoDB
const uri = 'mongodb+srv://rairibeiro:SUASENHA@cluster0.xg1tqmy.mongodb.net/';
const client = new MongoClient(uri);
let colecao; 


app.use(express.urlencoded({ extended: true }));


function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


function voltarComMensagem(res, tipo, texto) {
  const params = new URLSearchParams({ tipo, msg: texto });
  res.redirect('/?' + params.toString());
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/cadastrar', async (req, res) => {
  const nome = (req.body.nome || '').trim();
  const fabricante = (req.body.fabricante || '').trim();
  const categoria = (req.body.categoria || '').trim();


  const preco = Number(String(req.body.preco || '').trim().replace(',', '.'));

  // VALIDAÇÃO: campos vazios
  if (!nome || !fabricante || !categoria || req.body.preco === undefined || String(req.body.preco).trim() === '') {
    return voltarComMensagem(res, 'erro', 'Preencha todos os campos.');
  }

  
  if (Number.isNaN(preco) || preco <= 0) {
    return voltarComMensagem(res, 'erro', 'O preço deve ser um número maior que zero.');
  }


  try {
    const resultado = await colecao.insertOne({ nome, fabricante, categoria, preco });

    if (resultado.acknowledged) {
      return voltarComMensagem(res, 'ok', 'Equipamento cadastrado com sucesso!');
    }
    return voltarComMensagem(res, 'erro', 'Não foi possível cadastrar o equipamento.');
  } catch (erro) {
    console.error('Erro ao inserir:', erro);
    return voltarComMensagem(res, 'erro', 'Erro ao salvar no banco de dados.');
  }
});


app.get('/equipamentos', async (req, res) => {
  try {
    const lista = await colecao.find().toArray();

    const linhas = lista.map((e) => `
      <tr>
        <td>${escaparHtml(e.nome)}</td>
        <td>${escaparHtml(e.fabricante)}</td>
        <td>${escaparHtml(e.categoria)}</td>
        <td>R$ ${Number(e.preco).toFixed(2).replace('.', ',')}</td>
      </tr>`).join('');

    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Equipamentos Cadastrados</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f0f2f5; margin: 0; padding: 30px; }
    .container { max-width: 800px; margin: auto; background: #fff; padding: 25px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h1 { color: #1f3a5f; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
    th { background: #1f3a5f; color: #fff; }
    tr:hover td { background: #f5f8fc; }
    a { color: #1f3a5f; font-weight: bold; text-decoration: none; }
    .vazio { color: #777; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Equipamentos Cadastrados</h1>
    <p>Total de registros: <strong>${lista.length}</strong></p>
    ${lista.length === 0
      ? '<p class="vazio">Nenhum equipamento cadastrado ainda.</p>'
      : `<table>
          <thead><tr><th>Equipamento</th><th>Fabricante</th><th>Categoria</th><th>Preço</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>`}
    <p><a href="/">&larr; Voltar ao cadastro</a></p>
  </div>
</body>
</html>`);
  } catch (erro) {
    console.error('Erro ao consultar:', erro);
    res.status(500).send('Erro ao consultar os equipamentos.');
  }
});

async function iniciar() {
  try {
    await client.connect();
    colecao = client.db('manutencao').collection('equipamentos');
    console.log('Conectado ao MongoDB (banco: manutencao, coleção: equipamentos)');

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (erro) {
    console.error('Falha ao conectar ao MongoDB:', erro.message);
    process.exit(1);
  }
}


iniciar();