const { getUser, addKeys, addItem, addCoins, removeCoins, addCrates } = require('../database');
const { getSeasonal } = require('../config/seasons');

// Config for shop
const BASE_SHOP = [
  { id: 'keypack', label: 'Key Pack (3 keys)', type: 'keys', cost: 75, amount: 3 },
  { id: 'crate', label: 'Crate (1 key required later)', type: 'crate', cost: 100 },
  { id: 'workboost-10', label: 'Work Boost +10%', type: 'item', cost: 150, item: { name: 'Efficiency Apron', rarity: 'Rare', effect: 'work_boost_10' } },
  { id: 'workboost-20', label: 'Work Boost +20%', type: 'item', cost: 250, item: { name: 'Capable Cap', rarity: 'Epic', effect: 'work_boost_20' } },
];

function getShopItems() {
  const seasonal = getSeasonal();
  let shopItems = [...BASE_SHOP];
  if (seasonal) shopItems.push(...seasonal.items);
  return shopItems;
}

function getShopEmbed(userCoins) {
  const { EmbedBuilder } = require('discord.js');
  const seasonal = getSeasonal();
  const shopItems = getShopItems();

  const embed = new EmbedBuilder()
    .setTitle('🛒 Chef\'s Kitchen Shop')
    .setDescription(`Your coins: **${userCoins}**\nAvailable items:`)
    .setColor(0x1abc9c)
    .setTimestamp();

  for (const item of shopItems) {
    const desc = item.type === 'keys' ? `Get ${item.amount} keys` : item.type === 'crate' ? `Get ${item.amount || 1} crate${(item.amount || 1) > 1 ? 's' : ''}` : item.item ? `${item.item.name} (${item.item.rarity})` : '';
    embed.addFields({ name: `${item.label} [${item.id}]`, value: `${desc}\nCost: **${item.cost}** coins`, inline: false });
  }

  if (seasonal) embed.addFields({ name: '❄ Seasonal Shop', value: `Active: ${seasonal.name}`, inline: false });

  return embed;
}

function buyItem(userId, itemId) {
  const shopItems = getShopItems();
  const item = shopItems.find(it => it.id.toLowerCase() === itemId.toLowerCase());
  if (!item) return { success: false, message: '❌ Item not found.' };

  const user = getUser(userId);
  if (user.coins < item.cost) return { success: false, message: `❌ You need ${item.cost} coins, but you only have ${user.coins}.` };

  if (!removeCoins(userId, item.cost)) return { success: false, message: '❌ Could not complete transaction, please try again.' };

  if (item.type === 'keys') {
    addKeys(userId, item.amount);
    return { success: true, message: `✅ Purchased ${item.amount} keys for ${item.cost} coins!` };
  }

  if (item.type === 'crate') {
    const crateAmount = item.amount || 1;
    addCrates(userId, crateAmount);
    return { success: true, message: `✅ Purchased ${crateAmount} crate${crateAmount > 1 ? 's' : ''} for ${item.cost} coins. Use /opencase to open ${crateAmount > 1 ? 'them' : 'it'}!` };
  }

  if (item.type === 'item' && item.item) {
    addItem(userId, item.item);
    return { success: true, message: `✅ Purchased **${item.item.name}** (${item.item.rarity}) for ${item.cost} coins!` };
  }

  return { success: true, message: '✅ Purchase complete!' };
}

module.exports = { getShopItems, getShopEmbed, buyItem };