function checkShortCut(nickname, uid, userName) {
	/\{userName\}/gi.test(nickname) ? nickname = nickname.replace(/\{userName\}/gi, userName) : null;
	/\{userID\}/gi.test(uid) ? nickname = nickname.replace(/\{userID\}/gi, uid) : null;
	return nickname;
}

module.exports = {
	config: {
		name: "autosetname",
		version: "1.3",
		author: "NTKhang",
		cooldowns: 5,
		role: 1,
		description: {
			vi: "Tự đổi biệt danh cho thành viên mới vào nhóm chat",
			en: "Auto change nickname of new member"
		},
		category: "box chat",
		guide: {
			vi: '   {pn} set <nickname>: dùng để cài đặt cấu hình để tự đổi biệt danh, với các shortcut có sẵn:'
				+ '\n   + {userName}: tên thành viên vào nhóm'
				+ '\n   + {userID}: id thành viên'
				+ '\n   Ví dụ:'
				+ '\n    {pn} set {userName} 🚀'
				+ '\n\n   {pn} [on | off]: dùng để bật/tắt tính năng này'
				+ '\n\n   {pn} [view | info]: hiển thị cấu hình hiện tại',
			en: '   {pn} set <nickname>: use to set config to auto change nickname, with some shortcuts:'
				+ '\n   + {userName}: name of new member'
				+ '\n   + {userID}: member id'
				+ '\n   Example:'
				+ '\n    {pn} set {userName} 🚀'
				+ '\n\n   {pn} [on | off]: use to turn on/off this feature'
				+ '\n\n   {pn} [view | info]: show current config'
		}
	},

	langs: {
		vi: {
			missingConfig: "Vui lòng nhập cấu hình cần thiết",
			configSuccess: "Cấu hình đã được cài đặt thành công",
			currentConfig: "Cấu hình autoSetName hiện tại trong nhóm chat của bạn là:\n%1",
			notSetConfig: "Hiện tại nhóm bạn chưa cài đặt cấu hình autoSetName",
			syntaxError: "Sai cú pháp, chỉ có thể dùng \"{pn} on\" hoặc \"{pn} off\"",
			turnOnSuccess: "Tính năng autoSetName đã được bật",
			turnOffSuccess: "Tính năng autoSetName đã được tắt",
			error: "Đã có lỗi xảy ra khi sử dụng chức năng autoSetName, thử tắt tính năng liên kết mời trong nhóm và thử lại sau"
		},
		en: {
			missingConfig: "Alors, t'as vraiment rien foutu là. Mets une configuration, stp.",
			configSuccess: "La configuration a été installée avec succès, même toi tu pourrais le faire.",
			currentConfig: "La configuration autoSetName dans ton groupe de chat est :\n%1, comme tu veux ?",
			notSetConfig: "Ton groupe n'a pas encore configuré autoSetName. T'es sérieux ?",
			syntaxError: "Erreur de syntaxe, mec, seulement \"{pn} on\" ou \"{pn} off\". Tu savais pas ?",
			turnOnSuccess: "Le truc autoSetName est enfin activé. Peut-être que tu vas réussir à l'utiliser.",
			turnOffSuccess: "T'as réussi à désactiver autoSetName, félicitations pour avoir trouvé le bouton.",
			error: "Quelque chose a mal tourné. Peut-être que tu as cliqué sur le mauvais bouton, reviens plus tard. Le monde ne t'en voudra pas."
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		switch (args[0]) {
			case "set":
			case "add":
			case "config": {
				if (args.length < 2)
					return message.reply(getLang("missingConfig"));
				const configAutoSetName = args.slice(1).join(" ");
				await threadsData.set(event.threadID, configAutoSetName, "data.autoSetName");
				return message.reply(getLang("configSuccess"));
			}
			case "view":
			case "info": {
				const configAutoSetName = await threadsData.get(event.threadID, "data.autoSetName");
				return message.reply(configAutoSetName ? getLang("currentConfig", configAutoSetName) : getLang("notSetConfig"));
			}
			default: {
				const enableOrDisable = args[0];
				if (enableOrDisable !== "on" && enableOrDisable !== "off")
					return message.reply(getLang("syntaxError"));
				await threadsData.set(event.threadID, enableOrDisable === "on", "settings.enableAutoSetName");
				return message.reply(enableOrDisable == "on" ? getLang("turnOnSuccess") : getLang("turnOffSuccess"));
			}
		}
	},

	onEvent: async ({ message, event, api, threadsData, getLang }) => {
		if (event.logMessageType !== "log:subscribe")
			return;
		if (!await threadsData.get(event.threadID, "settings.enableAutoSetName"))
			return;
		const configAutoSetName = await threadsData.get(event.threadID, "data.autoSetName");

		return async function () {
			const addedParticipants = [...event.logMessageData.addedParticipants];

			for (const user of addedParticipants) {
				const { userFbId: uid, fullName: userName } = user;
				try {
					await api.changeNickname(checkShortCut(configAutoSetName, uid, userName), event.threadID, uid);
				}
				catch (e) {
					return message.reply(getLang("error"));
				}
			}
		};
	}
};
