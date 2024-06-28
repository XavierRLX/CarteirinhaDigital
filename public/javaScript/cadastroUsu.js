const supabaseUrl = 'https://mjjumtkxcqbdbynzmqqh.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qanVtdGt4Y3FiZGJ5bnptcXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg3MTA3NTIsImV4cCI6MjAzNDI4Njc1Mn0.1Bfat4NXHJjTFZf-RV6fFUNr56kVqjwetH4ROWBDEuE';
const adminPassword = 'admin1234';
let enteredPassword = '';

function checkAdminPassword() {
    const inputPassword = prompt("Por favor, insira a senha de administrador:");
    if (inputPassword !== adminPassword) {
        alert('Senha de administrador incorreta!');
        return false;
    }
    enteredPassword = inputPassword;
    return true;
}

document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

   const inputPassword = prompt("Por favor, insira a senha de administrador:");
    
    if (inputPassword !== 'cadastrarAdmin1234') {
        alert('Senha de administrador incorreta!');
        return;
    }

    const email = event.target.email.value;
    const password = event.target.password.value;
    const nome = event.target.nome.value;
    const nomePerfil = event.target.nomePerfil.value;
    const curso = event.target.curso.value;
    const campus = event.target.campus.value;
    const matricula = event.target.matricula.value;
    const cpf = event.target.cpf.value;
    const numeroTel = event.target.numeroTel.value;
    const dataNascimento = event.target.dataNascimento.value;
    const validade = event.target.validade.value;
    const fotoUrl = event.target.fotoUrl.value;

    const url = `${supabaseUrl}/rest/v1/users`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ email, password, nome, nomePerfil, campus, curso, matricula, validade, cpf, dataNascimento, numeroTel, fotoUrl }),
    
    });

    if (response.ok) {
        alert('Usuário cadastrado com sucesso!');
        loadUsers(); // Carregar a lista de usuários após o cadastro
    } else {
        const data = await response.json();
        alert('Erro: ' + data.error);
    }
});

// Função para carregar a lista de usuários
async function loadUsers() {
    const url = `${supabaseUrl}/rest/v1/users?select=*`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`
        },
    });

    if (response.ok) {
        const data = await response.json();
        const userList = document.getElementById('userList');
        userList.innerHTML = ''; // Limpar a lista de usuários
        data.forEach(user => {
            const userItem = document.createElement('div');
            userItem.innerHTML = `
                <p><strong>Nome:</strong> ${user.nome}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Número de Telefone:</strong> ${user.numeroTel}</p>
                <p><strong>Validade:</strong> ${user.validade}</p>
                <img src="${user.fotoUrl}" alt="Foto do Usuário" style="max-width: 50px;">
                <button onclick="deleteUser('${user.id}')">Excluir</button>
                <hr>
            `;
            userList.appendChild(userItem);
        });
    } else {
        alert('Erro ao carregar a lista de usuários');
    }
}

// Função para excluir um usuário
async function deleteUser(id) {


    const inputPassword = prompt("Por favor, insira a senha de administrador:");
    
    if (inputPassword !== 'excluirAdmin1234') {
        alert('Senha de administrador incorreta!');
        return;
    }


    const url = `${supabaseUrl}/rest/v1/users?id=eq.${id}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`
        },
    });

    if (response.ok) {
        alert('Usuário excluído com sucesso!');
        loadUsers(); // Carregar a lista de usuários após a exclusão
    } else {
        alert('Erro ao excluir o usuário');
    }
}

//Carregar a lista de usuários quando a página for carregada
window.onload = () => {
    if (checkAdminPassword()) {
        loadUsers();
    }
};