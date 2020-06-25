const Discord = require('discord.js');
const client = new Discord.Client();
let BotPrefix = "!";
let password;
let passwordChangeInterval = 0;
let lastUpdated = new Date();
let passwordTimeoutEvent;
/*
* Onstartup
* */
client.on('ready', () => {
    console.log("Connected as " + client.user.tag);
    client.user.setActivity("!Help for more info", {type: "CUSTOM_STATUS"});
    changePassword()
    passwordChangeInterval = 5000;
})
/*
* When the client got a message
* */
client.on('message', (receivedMessage) => {
    if (receivedMessage.author == client.user) {
        return
    }
    if (receivedMessage.content.startsWith(BotPrefix)) {
        processCommand(receivedMessage)
    }
})

/*
* Check which command has been invoked
* receivedMessage: The message that called this function
* */
async function processCommand(receivedMessage) {
    let prefix_length = BotPrefix.length
    let command = receivedMessage.content.substr(prefix_length);
    let splitCommand = command.split(" ");
    let mainCommand = splitCommand[0];
    let args = splitCommand.slice(1);
    switch (mainCommand) {
        case "prefix":
            prefixCommand(receivedMessage, args);
            break;
        case "password":
            passwordCommand(receivedMessage, args);
            break;
        case "help":
            helpCommand(receivedMessage, args);
            break;
        case "interval":
            intervalCommand(receivedMessage, args);
            break;
        case "timer":
            timerCommand(receivedMessage, args);
            break;
        case "countdown":
            countdownCommand(receivedMessage, args);
            break;
        case "invite":
            inviteCommand(receivedMessage, args);
            break;
        default:
            Error("unknown command, please refer to " + BotPrefix + "help for more information", receivedMessage);
            break;
    }
}

/*
* The !prefix command
* */
async function prefixCommand(receivedMessage, args) {
    if (args == undefined || args.length < 1) {
        Error("Not enough arguments given, please refer to " + BotPrefix + "help for more information", receivedMessage);
        return;
    }
    BotPrefix = args[0];
    console.log("My prefix has been changed to: " + BotPrefix);
    receivedMessage.channel.send("My prefix has been changed to: " + BotPrefix);
}

/*
* The !password command
* */
async function passwordCommand(receivedMessage, args) {
    receivedMessage.channel.send("The current password is: \n ```" + password + "```");
}

/*
* The !help command
* */
async function helpCommand(receivedMessage, args) {
    receivedMessage.channel.send("```Current supported commands: " +
        "\n" + BotPrefix + "prefix <prefix>\n" + BotPrefix + "password\n" + BotPrefix + "help\n" + BotPrefix + "interval:\n\tinterval <amount> <format: ms,s,m,h>\n\t\tformat - default ms\n" + BotPrefix + "timer```");
}

/*
* The !countdown command
*  */
async function countdownCommand(receivedMessage, args) {
    let now = new Date();
    let difference = now - lastUpdated

    let time = makeStringFromMS(passwordChangeInterval - difference);
    receivedMessage.channel.send(time + " left until the next password change.");
}

/*
* The !invite command
*  */
async function inviteCommand(receivedMessage, args) {
    if(!receivedMessage.member.hasPermission("ADMINISTRATOR")){
        Error("You don't have permission to issue this command", receivedMessage);
        return;
    }
    if (args == undefined || args.length < 1) {
        Error("Not enough arguments given, please refer to " + BotPrefix + "help for more information", receivedMessage);
        return;
    }
    let time;
    let maxPeople;
    let channedId;
    console.log(args)
    if (args[1] == undefined) {
        Error("Don't forget the channel ID, please refer to " + BotPrefix + "help for more information", receivedMessage);
        return;
    } else {
        channedId = args[1];
    }
    if (args[2] == undefined || args[2] >= 10) {
        maxPeople = 0;
    } else {
        maxPeople = args[2];
    }
    if (args[3] == undefined || args[3] * 60 > 84600) {
        time = 0;
    } else {
        time = args[3] * 60;
    }
    //removed cache for heroku
    let InviteChannel = client.channels.get(channedId);
    console.log("time: " + time)
    let id = receivedMessage.mentions.users.first().id;
    if (!InviteChannel.guild.member(id)) {
        let invite = await  InviteChannel.createInvite(
            {
                maxAge: time, // maximum time for the invite, in milliseconds
                maxUses: maxPeople // maximum times it can be used
            },
            `Requested with command by ${receivedMessage.author.tag}`
        );
        client.users.get(id).send("invite: https://discord.gg/" + invite);
        console.log("Message send to " + receivedMessage.mentions.users.first());
    } else {
        client.users.get(id).send("You're already in the server.");
        console.log("Message send to " + receivedMessage.mentions.users.first() + ". He was already in the server.");
    }

}

/*
* Set the interval when the password has to be changed
* receivedMessage: the messages that issued the command
* args: the totaltime and the kind of time (ms,s,m,h), default ms
* */
async function intervalCommand(receivedMessage, args) {
    if (args == undefined || args <= 0) {
        Error("Please enter a valid time, use " + BotPrefix + "help for more information", receivedMessage);
        return;
    }
    if (args.length == 1) {
        if (args[0].match(/\d*(ms|s|m|h)/) != undefined) {
            args[1] = args[0].match(/(\d*)(ms|s|m|h)/)[2];
            args[0] = args[0].match(/(\d*)(ms|s|m|h)/)[1];
        } else {
            passwordChangeInterval = args[0];
            timerCommand(receivedMessage, args);
            changePassword();
            return;
        }
    }

    let totalTime = args[0];
    switch (args[1]) {
        case "ms":
            totalTime = totalTime;
            break;
        case "s":
            totalTime *= 1000;
            break;
        case "m":
            totalTime *= 1000 * 60;
            break;
        case "h":
            totalTime *= 1000 * 60 * 60;
            break;
        default:
            Error("Unknown time, please refer to " + BotPrefix + "help for more information", receivedMessage);
            return
    }
    passwordChangeInterval = totalTime;
    timerCommand(receivedMessage, args);
    changePassword();
}

/*
* outputs the interval the password has changed in:
* days, hours, minutes, seconds, ms
* */
async function timerCommand(receivedMessage, args) {
    receivedMessage.channel.send("```The current interval is:\n" + makeStringFromMS(passwordChangeInterval) + " ```");
}

async function Error(error, receivedMessage) {
    receivedMessage.channel.send(error);
}

/*
* converts a value from ms to a string
* */
async function makeStringFromMS(msTotal) {
    let calcInterval = msTotal;
    let days = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let ms = 0;
    if (calcInterval >= 604800000) {
        return "1 week+";

    }
    while (calcInterval >= 86400000) {
        calcInterval -= 86400000;
        days += 1;
    }
    while (calcInterval >= 3600000) {
        calcInterval -= 3600000;
        hours += 1;
    }
    while (calcInterval >= 60000) {
        calcInterval -= 60000;
        minutes += 1;
    }
    while (calcInterval >= 1000) {
        calcInterval -= 1000;
        seconds += 1;
    }
    ms = calcInterval;
    return days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds " + ms + " ms";
}

/*
* Generates a random string in UUID format
* */
async function create_UUID() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

/*
* Changes the password each interval
* */
async function changePassword() {
    clearTimeout(passwordTimeoutEvent);
    password = create_UUID();
    lastUpdated = new Date();
    passwordTimeoutEvent = setTimeout(changePassword, passwordChangeInterval);
}

//client.login("NzE5NTMxOTQzMjg4NTA0Mzkz.Xt4yYg.AsYqoX5IPYf29CwQikxepzACPho")
client.login(process.env.token)
