// formatação: 

//número telefone (2199999999 > (21 99999-9999))
function formatNumeroTel(numeroTel) {
    numeroTel = String(numeroTel).replace(/\D/g, '');
    return numeroTel.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
}

//número matrícula (99999999999 > 9999 9999 999)
function formatMatricula(matricula) {
    matricula = String(matricula).replace(/\D/g, '');
    return matricula.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
}
//cpf (99999999999 > 999.999.999-99)
function formatCPF(cpf) {
cpf = String(cpf).replace(/\D/g, '');
return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// validade (2000/01/01 > Jan 2000 )
function formatValidade(validade) {
const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const [year, month, day] = validade.split('-');
return `${months[parseInt(month) - 1]} ${year}`;
}

// dt nascimento (2000-01-01 > 01 Jan 2000 )
function formatDate(dateString) {
const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const [year, month, day] = dateString.split('-');
return `${day} ${months[parseInt(month) - 1]} ${year}`;
}

// <!--S2Ab44TLNk5JG7mF senha supabse -->
