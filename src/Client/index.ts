import { Client, Collection } from "discord.js";
import { readFileSync, writeFileSync } from "fs";
import { Command, Config } from "../Interfaces/export";
import ConfigJson from "../config.json";
import request from "request";
import chalk from "chalk";
import axios from "axios";
import db from "quick.db";

class ExtendedClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  public config: Config = ConfigJson;

  public async init() {
    if (!this.config.prefix || !this.config.uid || !this.config.webhookLink)
      return console.log(
        "Please fill in all the information in the config.json file"
      );
    if (!this.config.webhookLink.includes("https://discord.com/api/webhooks"))
      return console.log("Please give a valid discord webhook link");

    request.get(
      {
        url: this.config.webhookLink,
        json: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
      (err, body, res) => {
        if (err) return console.log(err);
        else if (body.statusCode == 200) {
          var user_id = res.name;

          writeFileSync("webhook-name.txt", user_id);
        } else {
          console.log("[-]" + ` INVALID WEBHOOK ` + "[-]");
        }
      }
    );

    this.login(this.config.token);

    this.on("ready", async () => {
      const chalk = require("chalk");
      const { table } = require("table");
      const data = [
        [
          "LOGGED IN AS",
          `${chalk.red.bold(this.user.tag)}`,
          "The user that I am logged in as.",
        ],
        [
          "SERVERS",
          `${chalk.yellow.bold(this.guilds.size.toLocaleString())}`,
          "The amount of servers that I am in.",
        ],
        [
          "Prefix",
          `${chalk.cyan.bold(this.config.prefix)}`,
          "The prefix to use to run my commands",
        ],
        [
          "Webhook",
          `${chalk.green.bold(readFileSync("webhook-name.txt"))}`,
          "Webhook Found, messages will be logged to this webhook",
        ],
        ["INFO", `To exit`, "Press CTRL + C 2 times"],
      ];

      const config = {
        border: {
          topBody: `─`,
          topJoin: `┬`,
          topLeft: `┌`,
          topRight: `┐`,

          bottomBody: `─`,
          bottomJoin: `┴`,
          bottomLeft: `└`,
          bottomRight: `┘`,

          bodyLeft: `│`,
          bodyRight: `│`,
          bodyJoin: `│`,

          joinBody: `─`,
          joinLeft: `├`,
          joinRight: `┤`,
          joinJoin: `┼`,
        },
        header: {
          alignment: "center",
          content: "CLIENT DATA",
        },
      };
      console.log(table(data, config));
    });

    this.on("message", async (message) => {
      if (message.channel.type === "dm" || message.channel.type === "group") {
        console.log(
          `Alert | ${chalk.blueBright("Dm Logged")} | Dm By ${
            message.author.tag
          }. Check Webhook For More Info`
        );

        axios.post(this.config.webhookLink, {
          content: `**User:** <@${
            message.author.id
          }> \n**Dm Time:** ${new Date()} \n\n**Message:** \n\`\`\`${
            message.content
          }\`\`\``,
        });
      }
    });

    this.on("message", async (message) => {
      const getCollection = db.get(this.config.uid);
      if (message.author.id === this.config.uid) {
        if (message.content === this.config.prefix + "online") {
          if (!getCollection)
            return message.reply(
              "You're offline status has already been removed."
            );

          db.set(this.config.uid, []);
          message.reply("You're offline status has been removed");
        } else if (message.content === this.config.prefix + "offline") {
          if (getCollection)
            return message.reply(
              "You're online status has already been added."
            );

          db.delete(this.config.uid);
          message.reply(
            "You're status has been switched to offline. this means that messages are going to be saved in an external file and sent to you're webhook once you're online to see all the messages organized."
          );
        }
      }
    });

    this.on("message", async(message) => {
       const getCollection = db.get(this.config.uid);

       if(message.channel.type === "dm" || message.channel.type === "group") {
           if(getCollection) {
               message.channel.send("I have been set as afk by the owner of this account, this means that I am not here but will get back to you as soon as I'm back, feel free to edit you're above message for the owner to see")
           }
       }
    });
  }
}

export default ExtendedClient;
