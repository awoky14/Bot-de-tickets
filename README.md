# Discord Bot - Sistema de Tickets

Este repositorio contiene un bot de Discord diseñado para **gestionar tickets** de manera automática, permitiendo que los usuarios abran canales privados para consultas, soporte o cualquier tipo de interacción que requiera seguimiento individual.

## Funcionalidades del sistema de tickets

* **Creación de tickets**

  * Los usuarios pueden abrir un ticket mediante el uso de un boton para abrir tickets anodado a un embed, para verlo tendras que usar el comando `/setup-ticket`.
  * Se crea un canal privado accesible solo por el usuario y el personal autorizado del servidor.

* **Gestión de permisos**

  * Cada ticket tiene permisos configurados para mantener la privacidad.
  * Solo los miembros autorizados y el usuario que abrió el ticket pueden ver y escribir en el canal.

* **Notificaciones y logs**

  * Se pueden enviar mensajes de bienvenida en cada ticket.
  * Se pueden registrar las aperturas de tickets en un canal de logs del servidor para llevar un control.

* **Cierre de tickets**

  * Los tickets pueden cerrarse mediante comandos o botones interactivos.
  * Al cerrar un ticket, el canal se borrara automaticamente y la recopiliacion de todos los mensajes del canal sera redireccionada al canal de `logs` indicado por el usuario.


