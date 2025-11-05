const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
} = require('discord.js');
const fs = require('fs');
const transcript = require('discord-html-transcripts');

const SUPPORT_ROLE_ID = process.env.SUPPORT_ROLE_ID;
const LOG_CHANNEL_ID = 'Pon aqui el id del canal de logs';
const TICKETS_CATEGORY_ID = process.env.TICKETS_CATEGORY_ID;
const SECOND_CATEGORY_ID = process.env.SECOND_CATEGORY_ID;

const openTicketsPath = './openTickets.json';
let openTickets = {};

if (fs.existsSync(openTicketsPath)) {
  openTickets = JSON.parse(fs.readFileSync(openTicketsPath, 'utf8'));
}

function saveOpenTickets() {
  fs.writeFileSync(openTicketsPath, JSON.stringify(openTickets, null, 2));
}

module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {
    try {

      if (interaction.isChatInputCommand() && interaction.commandName === 'setup-tickets') {
        const embed = new EmbedBuilder()
          .setTitle('🎫 Sistema de Soporte')
          .setDescription(
            'Bienvenido(a), para crear un ticket dale **"click"** al botón de abajo.\n\n' +
            'Después de interactuar, se te creará un canal **privado** donde podrás hablar con el equipo de soporte.\n\n' +
            '• Recuerda que el mal uso de los tickets no está permitido, cualquier caso relacionado puede llegar a ser sancionado.'

          )
          .setColor('Blue');

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('create-ticket')
            .setLabel('Crear Ticket')
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] }).catch(() => {});
        await interaction.reply({ content: 'Mensaje de soporte enviado.', ephemeral: true }).catch(() => {});
        return;
      }

      if (interaction.isButton() && interaction.customId === 'create-ticket') {

        if (interaction.replied || interaction.deferred) return;

        const modal = new ModalBuilder()
          .setCustomId('ticket-modal')
          .setTitle('Crear Ticket - Razón');

        const motivoInput = new TextInputBuilder()
          .setCustomId('ticket-motivo')
          .setLabel('Razón del ticket:')
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(1)
          .setMaxLength(50)
          .setPlaceholder('Describe tu motivo o problema aquí...')
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(motivoInput));

        await interaction.showModal(modal).catch(async (err) => {
          console.error('Error mostrando modal:', err);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Ocurrió un error al abrir el ticket.', ephemeral: true }).catch(() => {});
          }
        });
        return;
      }


      if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'ticket-modal') {
        const motivo = interaction.fields.getTextInputValue('ticket-motivo');
        const user = interaction.user;
        const guild = interaction.guild;

        // Revisar si ya tiene ticket abierto
        const existing = guild.channels.cache.find(c => openTickets[c.id]?.creatorId === user.id);
        if (existing) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: `Ya tienes un ticket abierto: ${existing}`, ephemeral: true }).catch(() => {});
          }
          return;
        }

        const mainCategory = guild.channels.cache.get(TICKETS_CATEGORY_ID);
        const secondCategory = guild.channels.cache.get(SECOND_CATEGORY_ID);
        let parentCategoryId = TICKETS_CATEGORY_ID;

        if (mainCategory && mainCategory.children.cache.size >= 50) {
          if (secondCategory && secondCategory.children.cache.size < 50) {
            parentCategoryId = SECOND_CATEGORY_ID;
          } else {
            parentCategoryId = null; 
          }
        }

      
        const ticketChannel = await guild.channels.create({
          name: `ticket-${user.username}`.toLowerCase(),
          type: ChannelType.GuildText,
          parent: parentCategoryId,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ],
        });

        openTickets[ticketChannel.id] = {
          creatorId: user.id,
          createdAt: new Date().toISOString(),
          motivo,
        };
        saveOpenTickets();

        // Embed inicial
        const embed = new EmbedBuilder()
          .setDescription(
            `» ¡Hola! Estamos aquí para ayudarte.\n\n` +
            `» Por favor, adjunta todas las pruebas relevantes que puedas proporcionar en este canal. ¡Cuanta más información nos des, mejor podremos ayudarte!\n\n` +
            `» Te pedimos un poco de paciencia mientras revisamos tu consulta. ¡Estaremos en contacto contigo lo antes posible!\n\n` +
            `» Razón del ticket: **${motivo}**`
          )
          .setColor('Green')
          .setThumbnail(guild.iconURL({ size: 1024, dynamic: true }));

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('close-ticket').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('claim-ticket').setLabel('Reclamar').setStyle(ButtonStyle.Success)
        );

        await ticketChannel.send({ content: `<@${user.id}> <@&${SUPPORT_ROLE_ID}>`, embeds: [embed], components: [row] }).catch(() => {});

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: `Tu ticket ha sido creado: ${ticketChannel}`, ephemeral: true }).catch(() => {});
        }
        return;
      }

      if (interaction.isButton() && interaction.customId === 'claim-ticket') {
        const { user, guild, channel, member } = interaction;
        const ticket = openTickets[channel.id];

        if (!ticket || !member.roles.cache.has(SUPPORT_ROLE_ID)) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'No tienes permiso para reclamar este ticket.', ephemeral: true }).catch(() => {});
          }
          return;
        }

        await channel.permissionOverwrites.set([
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: ticket.creatorId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ]);

        ticket.claimedBy = user.id;
        saveOpenTickets();

        const oldMessage = await channel.messages.fetch({ limit: 10 }).then(msgs => msgs.find(msg => msg.components.length > 0));
        if (oldMessage) {
          const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close-ticket').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('claim-ticket').setLabel('Reclamar').setStyle(ButtonStyle.Success).setDisabled(true)
          );
          await oldMessage.edit({ components: [newRow] }).catch(() => {});
        }

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: `Has reclamado este ticket. Solo tú y <@${ticket.creatorId}> pueden verlo.`, ephemeral: true }).catch(() => {});
        }

        await channel.send({ content: `🎟️ Este ticket ha sido reclamado por <@${user.id}>. Solo él y <@${ticket.creatorId}> tienen acceso ahora.` }).catch(() => {});
        return;
      }

      if (interaction.isButton() && interaction.customId === 'close-ticket') {
        const { user, channel, member } = interaction;
        const ticket = openTickets[channel.id];

        if (!ticket || !member.roles.cache.has(SUPPORT_ROLE_ID)) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'No tienes permiso para cerrar este ticket.', ephemeral: true }).catch(() => {});
          }
          return;
        }

        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('valorar-ticket').setLabel('📝 Valorar asistencia').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('cancelar-cierre').setLabel('❌ Cancelar y cerrar').setStyle(ButtonStyle.Secondary)
        );

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [new EmbedBuilder().setColor('Blue').setDescription('¿Quieres valorar este ticket antes de cerrarlo?')], components: [confirmRow] }).catch(() => {});
        }
        return;
      }


      if (interaction.isButton() && interaction.customId === 'cancelar-cierre') {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'Cerrando ticket en 5 segundos...', ephemeral: true }).catch(() => {});
        }
        cerrarTicket(interaction.channel, interaction.user).catch(console.error);
        return;
      }

      if (interaction.isButton() && interaction.customId === 'valorar-ticket') {
        const ticket = openTickets[interaction.channel.id];
        if (!ticket || ticket.creatorId !== interaction.user.id) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Solo el creador del ticket puede valorar.', ephemeral: true }).catch(() => {});
          }
          return;
        }

        const modal = new ModalBuilder().setCustomId('valoracion-modal').setTitle('Valorar asistencia');
        const feedbackInput = new TextInputBuilder()
          .setCustomId('valoracion')
          .setLabel('¿Qué te pareció la atención del equipo?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(100);

        modal.addComponents(new ActionRowBuilder().addComponents(feedbackInput));
        await interaction.showModal(modal).catch(() => {});
        return;
      }

      if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'valoracion-modal') {
        const ticket = openTickets[interaction.channel.id];
        if (!ticket || interaction.user.id !== ticket.creatorId) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Solo el creador del ticket puede enviar valoración.', ephemeral: true }).catch(() => {});
          }
          return;
        }

        const valoracion = interaction.fields.getTextInputValue('valoracion');
        ticket.valoracion = valoracion;
        saveOpenTickets();

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '¡Gracias por tu valoración! Cerrando ticket en 5 segundos...', ephemeral: false }).catch(() => {});
        }

        cerrarTicket(interaction.channel, interaction.user).catch(console.error);
        return;
      }


      async function cerrarTicket(channel, closedBy) {
        const ticket = openTickets[channel.id];
        if (!ticket) return;

        const guild = channel.guild;

        const attachment = await transcript.createTranscript(channel, {
          limit: -1,
          returnType: 'attachment',
          filename: `${channel.name}.html`,
        }).catch(() => null);

        const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
          const sent = await logChannel.send({ files: attachment ? [attachment] : [] }).catch(() => {});
          const transcriptURL = sent?.attachments.first()?.url || 'No disponible';

          const logEmbed = new EmbedBuilder()
            .setTitle('📁 Ticket Cerrado')
            .setColor('Orange')
            .addFields(
              { name: '📌 Canal', value: `${channel.name}`, inline: true },
              { name: '👤 Creado por', value: `<@${ticket.creatorId}>`, inline: true },
              { name: '📅 Fecha de creación', value: `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`, inline: false },
              { name: '✅ Cerrado por', value: `<@${closedBy.id}>`, inline: true },
              ...(ticket.claimedBy ? [{ name: '🧑‍💼 Reclamado por', value: `<@${ticket.claimedBy}>`, inline: true }] : []),
              { name: '📝 Asunto', value: ticket.motivo || 'No especificado' },
              ...(ticket.valoracion ? [{ name: '🌟 Valoración', value: ticket.valoracion }] : []),
              { name: '📄 Transcript', value: `[Haz clic aquí para ver el transcript](${transcriptURL})` }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }

        delete openTickets[channel.id];
        saveOpenTickets();

        setTimeout(async () => {
          await channel.delete().catch(() => {});
        }, 5000);
      }
    } catch (error) {
      console.error('Error en interactionCreate:', error);
      if (interaction && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Ocurrió un error inesperado.', ephemeral: true }).catch(() => {});
      }
    }
  });
};

