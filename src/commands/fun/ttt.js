const { MessageType } = require('@whiskeysockets/baileys');
const config = require('../../config');
const logger = require('../../utils/logger');

// Helper function for string replacement
String.prototype.replaceAt = function (search, replace, from) {
    if (this.length > from) {
        return this.slice(0, from) + this.slice(from).replace(search, replace);
    }
    return this;
};

// Global game state
if (!global.game) global.game = {};
if (!global.fff) global.fff = [];

module.exports = {
    name: 'tictactoe',
    aliases: ['ttt', 'tgame'],
    category: 'game',
    description: 'Play Tic-tac-toe with another user',
    usage: 'tictactoe @user or tictactoe close',
    
    cooldown: 5,
    ownerOnly: false,
    groupOnly: true,
    privateOnly: false,
    adminOnly: false,
    botAdminRequired: false,
    
    maintainState: true,
    
    async execute(sock, message, args, user) {
        const chatId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        try {
            if (args[0]?.toLowerCase() === 'close') {
                if (!global.game[chatId] || !global.game[chatId].on) {
                    await sock.sendMessage(chatId, {
                        text: 'There is no game running in this group',
                        quoted: message
                    });
                    return;
                }

                const game = global.game[chatId];
                if (sender === game.player1.id || sender === game.player2.id) {
                    const winner = sender === game.player1.id ? game.player2 : game.player1;
                    const loser = sender === game.player1.id ? game.player1 : game.player2;
                    
                    await sock.sendMessage(chatId, {
                        text: `What a cry baby. ${loser.name} left the game.\nWinner is ${winner.name}.`,
                        mentions: [winner.id, loser.id],
                        quoted: message
                    });
                    
                    game.on = false;
                } else {
                    await sock.sendMessage(chatId, {
                        text: "You don't have any game running in this group",
                        quoted: message
                    });
                }
                return;
            }

            // Start new game
            if (mentionedJid.length === 0) {
                await sock.sendMessage(chatId, {
                    text: 'Please mention someone or say game close to close any existing game',
                    quoted: message
                });
                return;
            }

            if (!global.game[chatId] || !global.game[chatId].on) {
                const opponent = mentionedJid[0];
                global.game[chatId] = {
                    on: true,
                    board: "🔲🔲🔲\n🔲🔲🔲\n🔲🔲🔲",
                    board2: "123456789",
                    avcell: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
                    turn: opponent,
                    player1: { 
                        id: opponent,
                        name: (await sock.getContactName(opponent)) || opponent.split('@')[0]
                    },
                    player2: { 
                        id: sender,
                        name: (await sock.getContactName(sender)) || sender.split('@')[0]
                    },
                    bidd: "❌",
                    ttrns: [],
                    counting: 0
                };

                const info = await sock.sendMessage(chatId, {
                    text: global.game[chatId].board,
                    quoted: message
                });
                
                global.game[chatId].bid = info.key.id;
                global.fff.push(info.key.id);
            } else {
                await sock.sendMessage(chatId, {
                    text: 'A game is already running in this group',
                    quoted: message
                });
            }

        } catch (error) {
            logger.error(`Error in tictactoe command:`, error);
            await sock.sendMessage(chatId, {
                text: '❌ An error occurred while processing the game.',
                quoted: message
            });
        }
    },

    async onReply(sock, message, user) {
        const chatId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        const replyToId = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const move = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || '';
        
        try {
            if (!global.game[chatId] || !global.game[chatId].on) return;
            
            const game = global.game[chatId];
            if (replyToId !== game.bid) return;
            if (game.turn !== sender) {
                await sock.sendMessage(chatId, {
                    text: 'Not your turn!',
                    quoted: message
                });
                return;
            }

            if (!/^[1-9]$/.test(move)) {
                await sock.sendMessage(chatId, {
                    text: 'Please reply with a number from 1-9',
                    quoted: message
                });
                return;
            }

            if (!game.avcell.includes(move)) {
                await sock.sendMessage(chatId, {
                    text: 'This cell is already taken',
                    quoted: message
                });
                return;
            }

            // Process move
            game.avcell.splice(game.avcell.indexOf(move), 1);
            let input2 = move * 2;
            game.ttrns.forEach(e => {
                if (e < move) input2--;
            });

            if (["4", "5", "6"].includes(move)) input2++;
            else if (["7", "8", "9"].includes(move)) input2 += 2;

            game.board = game.board.replaceAt("🔲", game.bidd, input2 - 2);
            game.board2 = game.board2.replace(move, game.bidd);

            // Check win conditions
            const winPatterns = [
                [0,1,2], [3,4,5], [6,7,8], // Rows
                [0,3,6], [1,4,7], [2,5,8], // Columns
                [0,4,8], [2,4,6] // Diagonals
            ];

            const hasWon = winPatterns.some(pattern => {
                return pattern.every(index => game.board2[index] === game.bidd);
            });

            if (hasWon) {
                const winner = game.turn === game.player1.id ? game.player1 : game.player2;
                await sock.sendMessage(chatId, {
                    text: game.board
                });
                await sock.sendMessage(chatId, {
                    text: `🎮 Game Over!\n👑 Winner: ${winner.name}`,
                    mentions: [winner.id]
                });
                game.on = false;
            } else if (game.counting === 8) {
                await sock.sendMessage(chatId, {
                    text: game.board
                });
                await sock.sendMessage(chatId, {
                    text: "🎮 Game Over!\n🤝 It's a draw!"
                });
                game.on = false;
            } else {
                game.counting++;
                game.ttrns.push(move);
                game.turn = game.turn === game.player1.id ? game.player2.id : game.player1.id;
                game.bidd = game.bidd === "❌" ? "⭕" : "❌";

                const info = await sock.sendMessage(chatId, {
                    text: game.board
                });
                game.bid = info.key.id;
                global.fff.push(info.key.id);
            }

        } catch (error) {
            logger.error(`Error in tictactoe reply handler:`, error);
            await sock.sendMessage(chatId, {
                text: '❌ An error occurred during the game.',
                quoted: message
            });
        }
    }
};