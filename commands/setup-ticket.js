const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Envía el panel del sistema de tickets.")
    .addChannelOption(opt =>
      opt
        .setName("welcome_channel")
        .setDescription("Canal donde se enviará el mensaje del panel de soporte.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: "No tienes permiso para usar este comando.",
          ephemeral: true,
        });
      }

      const welcomeChannel = interaction.options.getChannel("welcome_channel");


      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("create-ticket")
          .setLabel("Crear ticket")
          .setStyle(ButtonStyle.Primary)
      );


      const embed = new EmbedBuilder()
        .setTitle("Sistema de soporte")
        .setDescription(
          "Para abrir un ticket, pulsa el botón que aparece debajo. " +
            "Se creará un canal privado donde podrás comunicarte con el equipo de soporte.\n\n" +
            "Por favor, usa los tickets de forma responsable. El mal uso del sistema puede acarrear sanciones."
        )
        .setColor("Blue");


      await welcomeChannel.send({ embeds: [embed], components: [row] });

      await interaction.reply({
        content: `El panel de soporte se ha enviado correctamente en ${welcomeChannel}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error ejecutando /setup-ticket:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Ha ocurrido un error al ejecutar el comando.",
          ephemeral: true,
        }).catch(() => {});
      }
    }
  },
};
