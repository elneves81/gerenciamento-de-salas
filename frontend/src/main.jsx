URL da solicitação
https://gerenciamentosalas.netlify.app/.netlify/functions/auth
Método da solicitação
GET
Código de status
405 Method Not Allowed
Endereço remoto
10.0.2.1:3128
Política do referenciador
strict-origin-when-cross-origin
access-control-allow-headers
Content-Type, Authorization
access-control-allow-methods
POST, OPTIONS
access-control-allow-origin
*
age
0
cache-control
no-cache
cache-status
"Netlify Durable"; fwd=bypass
cache-status
"Netlify Edge"; fwd=miss
content-type
application/json
date
Mon, 28 Jul 2025 18:24:49 GMT
netlify-vary
query
server
Netlify
strict-transport-security
max-age=31536000; includeSubDomains; preload
x-nf-request-id
01K194FEMEF2551WR8FK691M36
:authority
gerenciamentosalas.netlify.app
:method
GET
:path
/.netlify/functions/auth
:scheme
https
accept
application/json, text/plain, */*
accept-encoding
gzip, deflate, br, zstd
accept-language
pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7
authorization
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzUzNzI3MDc0LCJleHAiOjE3NTM3Mjc5NzR9.4Y-oD60EHMbQPevE0r6itWRYubWcvbs_wPEOPvXLrtM
dnt
1
priority
u=1, i
referer
https://gerenciamentosalas.netlify.app/
sec-ch-ua
"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"
sec-ch-ua-mobile
?1
sec-ch-ua-platform
"Android"
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-origin
user-agent
Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/darkMode.css'

// Verifica se o modo escuro está ativo ao carregar a aplicação
const isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
  document.body.classList.add('dark-mode');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
