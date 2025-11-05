# Bot de Tickets para Discord

![Hecho con JavaScript y Discord.js](https://img.shields.io/badge/Hecho%20con-JavaScript%20%26%20Discord.js-yellow?logo=javascript)

Este proyecto es un bot de Discord creado para gestionar tickets de soporte dentro de un servidor. Su función principal es permitir que los miembros del servidor puedan abrir un ticket de ayuda fácilmente mediante un botón, y que el staff pueda atenderlos en un canal privado. El bot está hecho con Node.js y Discord.js, y es totalmente personalizable. Puedes adaptarlo a tu servidor cambiando los textos, permisos o incluso el estilo del panel de tickets.

### 🧩 Qué hace el bot
- Envía un panel con un botón para abrir tickets.  
- Crea canales privados automáticamente para cada usuario.  
- Da acceso solo al usuario y al equipo de staff del servidor.  
- Permite cerrar los tickets con un botón.  
- Registra todos los mensajes enviados en el canal.

### ⚙️ Cómo ponerlo en funcionamiento
1. Descarga o clona este repositorio.

2. Sube los archivos a Visual Studio Code o directamente a donde tengas hosteado el bot.

3. Cambiar o incluir alguna información para que funcione correctamente:

   En el archivo **.env** añade todos los ID y el token del bot.

   Dentro de la carpeta *handlers* entra al archivo **ticketHandler.js** y dirigete a la linea 17 e indica el canal de logs para los tickets.

   En el archivo mencionado anteriormente y en **setup-ticket.js** que se encuentra en la carpeta *commands* puedes cambiar la descripción del embed inicial, cambialo de los 2 si lo quieres cambiar.

   Puedes OPCIONALMENTE cambiar la presencia del bot en **index.js** linea 49.

4. Inicia el bot con el comando **node index.js**
