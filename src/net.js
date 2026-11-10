// 連線層：把「即時房間」包成簡單的介面。
// 之後如果要改用自己的伺服器，只要換掉這個檔案，遊戲其他部分不用動。

let roomPromise = null;
const getRoom = () => (roomPromise ??= window.claude?.use ? window.claude.use('room').catch(() => null) : Promise.resolve(null));

/** 這個畫面能不能連線 */
export async function canConnect() {
  return !!(await getRoom());
}

/**
 * 加入房號 code 的房間。
 * onOpponent(presence | null) 在對手出現、更新或離開時呼叫。
 * 回傳 { setMine(state), close() }；不能連線時回傳 null。
 */
export async function openRoom(code, onOpponent) {
  const room = await getRoom();
  if (!room) return null;
  let r;
  try {
    r = await room.join(`cth-pvp-${code}`);
  } catch {
    return null;
  }
  let current = null;
  let locked = null; // 鎖定第一個遇到的對手，第三個人加入也不會被換掉
  const pickOpponent = (peers) => {
    const others = peers.filter((p) => !p.sameTab && p.presence?.app === 'cth').sort((a, b) => (a.peer < b.peer ? -1 : 1));
    const opp = others.find((p) => p.peer === locked) ?? (locked ? null : others[0]) ?? null;
    if (opp && !locked) locked = opp.peer;
    const presence = opp?.presence ?? null;
    if (presence !== current) {
      current = presence;
      onOpponent(presence);
    }
  };
  const off = r.onPeers((ch) => pickOpponent(ch.peers), () => onOpponent(null));
  return {
    setMine: (state) => r.presence(state).catch(() => {}),
    /** 對手離開太久時解除鎖定，讓下一位可以加入 */
    unlock: () => { locked = null; },
    close: () => {
      off();
      r.leave().catch(() => {});
    },
  };
}
