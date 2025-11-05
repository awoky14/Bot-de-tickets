require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes, ActivityType } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

client.commands = new Collection();
const commands = [];


const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && typeof command.execute === "function") {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`Comando cargado: ${command.data.name}`);
  } else {
    console.warn(`El comando ${file} no tiene la estructura correcta.`);
  }
}


const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

client.once("ready", async () => {
  console.log(`Bot iniciado como ${client.user.tag}`);

  try {
    await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commands });
    console.log("Comandos registrados correctamente.");
  } catch (err) {
    console.error("Error registrando los comandos:", err);
  }

  client.user.setPresence({
    activities: [{ name: "Sistema de tickets activo", type: ActivityType.Watching }],
    status: "online",
  });


  const handlersPath = path.join(__dirname, "handlers");
  fs.readdirSync(handlersPath).forEach(file => {
    if (!file.endsWith(".js")) return;
    try {
      const handler = require(path.join(handlersPath, file));
      if (typeof handler === "function") {
        handler(client);
        console.log(`Handler cargado: ${file}`);
      } else {
        console.warn(`El archivo ${file} no exporta una función.`);
      }
    } catch (err) {
      console.error(`Error al cargar el handler ${file}:`, err);
    }
  });
});


client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`Error ejecutando el comando ${interaction.commandName}:`, err);
    if (!interaction.replied) {
      await interaction.reply({ content: "Ocurrió un error al ejecutar este comando.", ephemeral: true });
    }
  }
});

client.login(BOT_TOKEN);
