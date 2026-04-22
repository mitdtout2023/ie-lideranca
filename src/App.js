import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTsZk-iRULb3dB0H7rpZ44vEWjt330mkc",
  authDomain: "ie-lideranca.firebaseapp.com",
  projectId: "ie-lideranca",
  storageBucket: "ie-lideranca.firebasestorage.app",
  messagingSenderId: "405923605074",
  appId: "1:405923605074:web:c1aa2b79b80c9b71e2cd8b"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const ADMIN_PASSWORD = "1234";

const defaultAuthor = {
  name: "Ana Beatriz Mendes",
  title: "Psicóloga & Coach de Desenvolvimento Humano",
  bio: "Com mais de 15 anos dedicados ao desenvolvimento humano, acredito que a inteligência emocional é a habilidade mais transformadora que um ser humano pode cultivar.",
  avatar: "👩‍💼",
  stat1Label: "Anos de Experiência", stat1Value: "15+",
  stat2Label: "Pessoas Impactadas", stat2Value: "2K+",
  stat3Label: "Publicações", stat3Value: "47",
  mission: "Acredito que quando desenvolvemos nossa inteligência emocional, transformamos não só nossa vida profissional, mas todos os relacionamentos que cultivamos.",
};

const defaultAppearance = {
  appName: "IE & Liderança",
  appSubtitle: "Inteligência Emocional & Soft Skills",
  appIcon: "🧠",
  footerText: "Inteligência Emocional & Liderança",
  colorPrimary: "#1E3A5F",
  colorSecondary: "#2E6DA4",
  bgColor: "#F0F4F8",
  showFooter: true,
  showSubtitle: true,
  gridCols: 2,
};

const categoryColors = {
  autoconhecimento: "#FF6B6B", empatia: "#4ECDC4", resiliencia: "#45B7D1",
  comunicacao: "#96CEB4", lideranca: "#FFEAA7", autogestao: "#DDA0DD",
};

const categoryLabels = {
  autoconhecimento: "Autoconhecimento", empatia: "Empatia", resiliencia: "Resiliência",
  comunicacao: "Comunicação", lideranca: "Liderança", autogestao: "Autogestão",
};

const avatarOptions = ["👩‍💼","👨‍💼","👩‍🏫","👨‍🏫","👩‍⚕️","👨‍⚕️","🧑‍💻","👩‍🎓","👨‍🎓","🧑‍🏫"];
const iconOptions = ["💡","🎯","🧠","❤️","🤝","🔥","🌈","⭐","🏆","🌺"];
const appIconOptions = ["🧠","💡","❤️","🌟","🎯","🔥","🤝","🌱","⚡","🏆"];

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMsg, setNewMsg] = useState({ title: "", content: "", category: "autoconhecimento", icon: "💡" });
  const [activeTab, setActiveTab] = useState("todas");
  const [isAdmin, setIsAdmin] = useState(false);
  const [author, setAuthor] = useState(defaultAuthor);
  const [appearance, setAppearance] = useState(defaultAppearance);
  const [editingMessage, setEditingMessage] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "author"), (d) => {
      if (d.exists()) setAuthor({ ...defaultAuthor, ...d.data() });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "appearance"), (d) => {
      if (d.exists()) setAppearance({ ...defaultAppearance, ...d.data() });
    });
    return () => unsub();
  }, []);

  const handleAddMessage = async () => {
    if (!newMsg.title || !newMsg.content) return;
    if (editingMessage) {
      await updateDoc(doc(db, "messages", editingMessage.id), {
        ...newMsg, color: categoryColors[newMsg.category],
      });
      setEditingMessage(null);
    } else {
      await addDoc(collection(db, "messages"), {
        ...newMsg, color: categoryColors[newMsg.category], createdAt: Date.now(),
      });
    }
    setNewMsg({ title: "", content: "", category: "autoconhecimento", icon: "💡" });
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "messages", id));
    setSelectedMessage(null);
    setScreen("home");
  };

  const handleEditMessage = (msg) => {
    setEditingMessage(msg);
    setNewMsg({ title: msg.title, content: msg.content, category: msg.category, icon: msg.icon });
    setShowAddForm(true);
    setScreen("home");
  };

  const grad = `linear-gradient(135deg, ${appearance.colorPrimary}, ${appearance.colorSecondary})`;

  return (
    <div style={{ ...s.root, background: appearance.bgColor }}>
      <div style={s.screen}>
        {screen === "home" && (
          <HomeScreen messages={messages} loading={loading} activeTab={activeTab} setActiveTab={setActiveTab}
            setScreen={setScreen} setSelectedMessage={setSelectedMessage}
            showAddForm={showAddForm} setShowAddForm={setShowAddForm}
            newMsg={newMsg} setNewMsg={setNewMsg} handleAddMessage={handleAddMessage}
            editingMessage={editingMessage} setEditingMessage={setEditingMessage}
            appearance={appearance} grad={grad} />
        )}
        {screen === "author" && <AuthorScreen author={author} grad={grad} appearance={appearance} />}
        {screen === "detail" && selectedMessage && (
          <DetailScreen message={selectedMessage} setScreen={setScreen}
            handleDelete={handleDelete} handleEditMessage={handleEditMessage}
            isAdmin={isAdmin} appearance={appearance} grad={grad} />
        )}
        {screen === "admin" && (
          <AdminScreen isAdmin={isAdmin} setIsAdmin={setIsAdmin}
            author={author} appearance={appearance}
            messages={messages} handleDelete={handleDelete} handleEditMessage={handleEditMessage}
            grad={grad} />
        )}
      </div>
      <div style={s.tabBar}>
        {[
          { id: "home", icon: appearance.appIcon || "🧠", label: "Início" },
          { id: "author", icon: "👤", label: "Autor" },
          { id: "admin", icon: "⚙️", label: "Admin" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setScreen(tab.id)}
            style={{ ...s.tabButton, color: screen === tab.id ? appearance.colorPrimary : "#9CA3AF" }}>
            <span style={s.tabIcon}>{tab.icon}</span>
            <span style={s.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeScreen({ messages, loading, activeTab, setActiveTab, setScreen, setSelectedMessage, showAddForm, setShowAddForm, newMsg, setNewMsg, handleAddMessage, editingMessage, setEditingMessage, appearance, grad }) {
  const categories = ["todas", ...Object.keys(categoryLabels)];
  const filtered = activeTab === "todas" ? messages : messages.filter((m) => m.category === activeTab);
  const cols = appearance.gridCols || 2;

  return (
    <div style={s.page}>
      <div style={s.homeHeader}>
        <div>
          <div style={{ ...s.appBadge, background: grad }}>
            <span style={{ fontSize: 18 }}>{appearance.appIcon || "🧠"}</span>
            <span style={s.appBadgeText}>{appearance.appName || "IE & Liderança"}</span>
          </div>
          {appearance.showSubtitle !== false && (
            <p style={s.homeSubtitle}>{appearance.appSubtitle || "Inteligência Emocional & Soft Skills"}</p>
          )}
        </div>
        <button onClick={() => { setShowAddForm(!showAddForm); setEditingMessage(null); setNewMsg({ title: "", content: "", category: "autoconhecimento", icon: "💡" }); }}
          style={{ ...s.addButton, background: grad, boxShadow: `0 4px 12px ${appearance.colorPrimary}55` }}>
          {showAddForm ? "✕" : "+"}
        </button>
      </div>

      {showAddForm && (
        <div style={s.addForm}>
          <p style={s.formTitle}>{editingMessage ? "✏️ Editar Mensagem" : "Nova Mensagem"}</p>
          <input style={s.formInput} placeholder="Título" value={newMsg.title}
            onChange={(e) => setNewMsg({ ...newMsg, title: e.target.value })} />
          <textarea style={{ ...s.formInput, height: 80, resize: "none" }}
            placeholder="Conteúdo..." value={newMsg.content}
            onChange={(e) => setNewMsg({ ...newMsg, content: e.target.value })} />
          <select style={{ ...s.formInput, marginBottom: 10 }} value={newMsg.category}
            onChange={(e) => setNewMsg({ ...newMsg, category: e.target.value })}>
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div style={s.iconPicker}>
            {iconOptions.map((icon) => (
              <button key={icon} onClick={() => setNewMsg({ ...newMsg, icon })}
                style={{ ...s.iconOption, background: newMsg.icon === icon ? "#DBEAFE" : "transparent", borderColor: newMsg.icon === icon ? appearance.colorPrimary : "#E5E7EB" }}>
                {icon}
              </button>
            ))}
          </div>
          <button onClick={handleAddMessage} style={{ ...s.saveButton, background: grad }}>
            {editingMessage ? "Salvar Alterações" : "Salvar Mensagem"}
          </button>
        </div>
      )}

      <div style={s.categoryScroll}>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            style={{ ...s.categoryChip, background: activeTab === cat ? appearance.colorPrimary : "#F3F4F6", color: activeTab === cat ? "#fff" : "#6B7280" }}>
            {cat === "todas" ? "Todas" : categoryLabels[cat]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.emptyBox}><p style={s.loadingText}>⏳ Carregando...</p></div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={s.emptyText}>Nenhuma mensagem ainda.</p>
          <p style={s.emptySubText}>Toque em + para adicionar!</p>
        </div>
      ) : (
        <div style={{ ...s.messageGrid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {filtered.map((msg) => (
            <button key={msg.id} style={s.messageCard}
              onClick={() => { setSelectedMessage(msg); setScreen("detail"); }}>
              <div style={{ ...s.cardIconBg, background: msg.color + "22" }}>
                <span style={s.cardIcon}>{msg.icon}</span>
              </div>
              <p style={s.cardTitle}>{msg.title}</p>
              <span style={{ ...s.cardBadge, background: msg.color + "22", color: msg.color }}>
                {categoryLabels[msg.category]}
              </span>
            </button>
          ))}
        </div>
      )}
      {appearance.showFooter !== false && (
        <p style={s.footerNote}>{appearance.footerText || "Inteligência Emocional & Liderança"}</p>
      )}
    </div>
  );
}

function DetailScreen({ message, setScreen, handleDelete, handleEditMessage, isAdmin, appearance, grad }) {
  return (
    <div style={s.page}>
      <div style={s.detailHeader}>
        <button onClick={() => setScreen("home")} style={{ ...s.backButton, color: appearance.colorPrimary }}>← Voltar</button>
        {isAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleEditMessage(message)} style={s.editButton}>✏️</button>
            <button onClick={() => handleDelete(message.id)} style={s.deleteButton}>🗑</button>
          </div>
        )}
      </div>
      <div style={s.detailHero}>
        <div style={{ ...s.detailIconBg, background: message.color + "22" }}>
          <span style={s.detailIcon}>{message.icon}</span>
        </div>
        <span style={{ ...s.detailBadge, background: message.color + "22", color: message.color }}>
          {categoryLabels[message.category]}
        </span>
      </div>
      <h1 style={s.detailTitle}>{message.title}</h1>
      <div style={s.detailCard}>
        <div style={{ width: 4, background: message.color, borderRadius: 4, marginRight: 16, flexShrink: 0 }} />
        <p style={s.detailContent}>{message.content}</p>
      </div>
      <div style={{ ...s.reflectBox, background: `linear-gradient(135deg, ${appearance.colorPrimary}18, ${appearance.colorSecondary}18)` }}>
        <p style={{ ...s.reflectTitle, color: appearance.colorPrimary }}>💭 Reflita sobre isso</p>
        <p style={s.reflectText}>Como você pode aplicar essa ideia no seu dia a dia?</p>
      </div>
    </div>
  );
}

function AuthorScreen({ author, grad, appearance }) {
  return (
    <div style={s.page}>
      <div style={s.authorHero}>
        <div style={{ ...s.authorAvatarBg, boxShadow: `0 8px 24px ${appearance.colorPrimary}33` }}>
          <span style={s.authorAvatar}>{author.avatar}</span>
        </div>
      </div>
      <div style={s.authorInfo}>
        <h1 style={s.authorName}>{author.name}</h1>
        <p style={{ ...s.authorTitle, color: appearance.colorPrimary }}>{author.title}</p>
      </div>
      <div style={s.statsRow}>
        {[
          { label: author.stat1Label, value: author.stat1Value },
          { label: author.stat2Label, value: author.stat2Value },
          { label: author.stat3Label, value: author.stat3Value },
        ].map((st) => (
          <div key={st.label} style={s.statBox}>
            <p style={{ ...s.statValue, color: appearance.colorPrimary }}>{st.value}</p>
            <p style={s.statLabel}>{st.label}</p>
          </div>
        ))}
      </div>
      <div style={s.bioCard}>
        <p style={s.bioTitle}>Sobre</p>
        <p style={s.bioText}>{author.bio}</p>
      </div>
      <div style={{ ...s.missionCard, background: grad }}>
        <span style={{ fontSize: 28, marginBottom: 8, display: "block" }}>✨</span>
        <p style={s.missionTitle}>Missão</p>
        <p style={s.missionText}>"{author.mission}"</p>
      </div>
    </div>
  );
}

function AdminScreen({ isAdmin, setIsAdmin, author, appearance, messages, handleDelete, handleEditMessage, grad }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [adminTab, setAdminTab] = useState("aparencia");
  const [editAuthor, setEditAuthor] = useState(author);
  const [editAppearance, setEditAppearance] = useState(appearance);
  const [saved, setSaved] = useState("");

  useEffect(() => { setEditAuthor(author); }, [author]);
  useEffect(() => { setEditAppearance(appearance); }, [appearance]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { setIsAdmin(true); setError(""); }
    else setError("Senha incorreta.");
  };

  const saveData = async (type) => {
    if (type === "autor") await setDoc(doc(db, "config", "author"), editAuthor);
    if (type === "aparencia") await setDoc(doc(db, "config", "appearance"), editAppearance);
    setSaved(type);
    setTimeout(() => setSaved(""), 2000);
  };

  if (!isAdmin) {
    return (
      <div style={s.page}>
        <div style={s.adminLoginBox}>
          <span style={{ fontSize: 52, marginBottom: 16, display: "block", textAlign: "center" }}>🔐</span>
          <h2 style={s.adminLoginTitle}>Área Administrativa</h2>
          <p style={s.adminLoginSub}>Digite a senha para continuar</p>
          <input style={{ ...s.formInput, textAlign: "center", fontSize: 24, letterSpacing: 8 }}
            type="password" placeholder="••••" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          {error && <p style={s.errorText}>{error}</p>}
          <button onClick={handleLogin} style={{ ...s.saveButton, background: grad }}>Entrar</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "aparencia", label: "🎨 Tela Início" },
    { id: "autor", label: "👤 Autor" },
    { id: "mensagens", label: "💬 Mensagens" },
  ];

  return (
    <div style={s.page}>
      <div style={s.adminHeader}>
        <div>
          <p style={s.adminHeaderTitle}>⚙️ Painel Admin</p>
          <p style={s.adminHeaderSub}>Edite o conteúdo do app</p>
        </div>
        <button onClick={() => setIsAdmin(false)} style={s.logoutButton}>Sair</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setAdminTab(t.id)}
            style={{ ...s.categoryChip, background: adminTab === t.id ? appearance.colorPrimary : "#F3F4F6", color: adminTab === t.id ? "#fff" : "#6B7280", whiteSpace: "nowrap", fontSize: 12 }}>
            {t.label}
          </button>
        ))}
      </div>

      {adminTab === "aparencia" && (
        <div style={s.addForm}>
          <p style={s.formTitle}>🎨 Aparência da Tela Início</p>

          <p style={s.fieldLabel}>Ícone do App</p>
          <div style={{ ...s.iconPicker, marginBottom: 12 }}>
            {appIconOptions.map((ic) => (
              <button key={ic} onClick={() => setEditAppearance({ ...editAppearance, appIcon: ic })}
                style={{ ...s.iconOption, fontSize: 24, background: editAppearance.appIcon === ic ? "#DBEAFE" : "transparent", borderColor: editAppearance.appIcon === ic ? appearance.colorPrimary : "#E5E7EB" }}>
                {ic}
              </button>
            ))}
          </div>

          <p style={s.fieldLabel}>Nome do App</p>
          <input style={s.formInput} value={editAppearance.appName}
            onChange={(e) => setEditAppearance({ ...editAppearance, appName: e.target.value })} />

          <p style={s.fieldLabel}>Subtítulo</p>
          <input style={s.formInput} value={editAppearance.appSubtitle}
            onChange={(e) => setEditAppearance({ ...editAppearance, appSubtitle: e.target.value })} />

          <p style={s.fieldLabel}>Texto do Rodapé</p>
          <input style={s.formInput} value={editAppearance.footerText}
            onChange={(e) => setEditAppearance({ ...editAppearance, footerText: e.target.value })} />

          <p style={s.fieldLabel}>Cor Principal</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
            <input type="color" value={editAppearance.colorPrimary}
              onChange={(e) => setEditAppearance({ ...editAppearance, colorPrimary: e.target.value })}
              style={{ width: 48, height: 48, borderRadius: 12, border: "none", cursor: "pointer" }} />
            <input style={{ ...s.formInput, flex: 1, marginBottom: 0 }} value={editAppearance.colorPrimary}
              onChange={(e) => setEditAppearance({ ...editAppearance, colorPrimary: e.target.value })} />
          </div>

          <p style={s.fieldLabel}>Cor Secundária (gradiente)</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
            <input type="color" value={editAppearance.colorSecondary}
              onChange={(e) => setEditAppearance({ ...editAppearance, colorSecondary: e.target.value })}
              style={{ width: 48, height: 48, borderRadius: 12, border: "none", cursor: "pointer" }} />
            <input style={{ ...s.formInput, flex: 1, marginBottom: 0 }} value={editAppearance.colorSecondary}
              onChange={(e) => setEditAppearance({ ...editAppearance, colorSecondary: e.target.value })} />
          </div>

          <p style={s.fieldLabel}>Cor de Fundo</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
            <input type="color" value={editAppearance.bgColor}
              onChange={(e) => setEditAppearance({ ...editAppearance, bgColor: e.target.value })}
              style={{ width: 48, height: 48, borderRadius: 12, border: "none", cursor: "pointer" }} />
            <input style={{ ...s.formInput, flex: 1, marginBottom: 0 }} value={editAppearance.bgColor}
              onChange={(e) => setEditAppearance({ ...editAppearance, bgColor: e.target.value })} />
          </div>

          <p style={s.fieldLabel}>Colunas dos Cards</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[1, 2, 3].map((n) => (
              <button key={n} onClick={() => setEditAppearance({ ...editAppearance, gridCols: n })}
                style={{ ...s.categoryChip, flex: 1, background: editAppearance.gridCols === n ? appearance.colorPrimary : "#F3F4F6", color: editAppearance.gridCols === n ? "#fff" : "#6B7280" }}>
                {n} coluna{n > 1 ? "s" : ""}
              </button>
            ))}
          </div>

          <p style={s.fieldLabel}>Exibir</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { key: "showSubtitle", label: "Subtítulo" },
              { key: "showFooter", label: "Rodapé" },
            ].map((item) => (
              <button key={item.key}
                onClick={() => setEditAppearance({ ...editAppearance, [item.key]: !editAppearance[item.key] })}
                style={{ ...s.categoryChip, flex: 1, background: editAppearance[item.key] !== false ? appearance.colorPrimary : "#F3F4F6", color: editAppearance[item.key] !== false ? "#fff" : "#6B7280" }}>
                {editAppearance[item.key] !== false ? "✅" : "⬜"} {item.label}
              </button>
            ))}
          </div>

          <div style={{ background: `linear-gradient(135deg, ${editAppearance.colorPrimary}, ${editAppearance.colorSecondary})`, borderRadius: 16, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{editAppearance.appIcon}</span>
            <div>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 14, margin: 0 }}>{editAppearance.appName}</p>
              {editAppearance.showSubtitle !== false && <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: 0 }}>{editAppearance.appSubtitle}</p>}
            </div>
          </div>

          <button onClick={() => saveData("aparencia")}
            style={{ ...s.saveButton, background: saved === "aparencia" ? "#16a34a" : grad }}>
            {saved === "aparencia" ? "✅ Salvo!" : "Salvar Aparência"}
          </button>
        </div>
      )}

      {adminTab === "autor" && (
        <div style={s.addForm}>
          <p style={s.formTitle}>👤 Editar Autor</p>
          <p style={s.fieldLabel}>Avatar</p>
          <div style={{ ...s.iconPicker, marginBottom: 12 }}>
            {avatarOptions.map((av) => (
              <button key={av} onClick={() => setEditAuthor({ ...editAuthor, avatar: av })}
                style={{ ...s.iconOption, fontSize: 26, width: 48, height: 48, background: editAuthor.avatar === av ? "#DBEAFE" : "transparent", borderColor: editAuthor.avatar === av ? appearance.colorPrimary : "#E5E7EB" }}>
                {av}
              </button>
            ))}
          </div>
          <p style={s.fieldLabel}>Nome</p>
          <input style={s.formInput} value={editAuthor.name}
            onChange={(e) => setEditAuthor({ ...editAuthor, name: e.target.value })} />
          <p style={s.fieldLabel}>Título / Cargo</p>
          <input style={s.formInput} value={editAuthor.title}
            onChange={(e) => setEditAuthor({ ...editAuthor, title: e.target.value })} />
          <p style={s.fieldLabel}>Bio</p>
          <textarea style={{ ...s.formInput, height: 100, resize: "none" }} value={editAuthor.bio}
            onChange={(e) => setEditAuthor({ ...editAuthor, bio: e.target.value })} />
          <p style={s.fieldLabel}>Missão</p>
          <textarea style={{ ...s.formInput, height: 80, resize: "none" }} value={editAuthor.mission}
            onChange={(e) => setEditAuthor({ ...editAuthor, mission: e.target.value })} />
          <p style={s.fieldLabel}>Estatísticas</p>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={{ ...s.formInput, flex: 2, marginBottom: 0 }} placeholder="Label"
                value={editAuthor[`stat${n}Label`]}
                onChange={(e) => setEditAuthor({ ...editAuthor, [`stat${n}Label`]: e.target.value })} />
              <input style={{ ...s.formInput, flex: 1, marginBottom: 0 }} placeholder="Valor"
                value={editAuthor[`stat${n}Value`]}
                onChange={(e) => setEditAuthor({ ...editAuthor, [`stat${n}Value`]: e.target.value })} />
            </div>
          ))}
          <button onClick={() => saveData("autor")}
            style={{ ...s.saveButton, marginTop: 12, background: saved === "autor" ? "#16a34a" : grad }}>
            {saved === "autor" ? "✅ Salvo!" : "Salvar Autor"}
          </button>
        </div>
      )}

      {adminTab === "mensagens" && (
        <div>
          {messages.length === 0 ? (
            <div style={s.emptyBox}><p style={s.emptyText}>Nenhuma mensagem ainda.</p></div>
          ) : messages.map((msg) => (
            <div key={msg.id} style={s.adminMsgCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, overflow: "hidden" }}>
                <div style={{ ...s.cardIconBg, width: 44, height: 44, flexShrink: 0, background: msg.color + "22" }}>
                  <span style={{ fontSize: 22 }}>{msg.icon}</span>
                </div>
                <div style={{ overflow: "hidden" }}>
                  <p style={{ ...s.cardTitle, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.title}</p>
                  <span style={{ ...s.cardBadge, background: msg.color + "22", color: msg.color }}>
                    {categoryLabels[msg.category]}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => handleEditMessage(msg)} style={s.editButton}>✏️</button>
                <button onClick={() => handleDelete(msg.id)} style={s.deleteButton}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  root: { display: "flex", flexDirection: "column", height: "100dvh", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", maxWidth: 430, margin: "0 auto" },
  screen: { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" },
  tabBar: { height: 80, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "space-around", alignItems: "flex-start", paddingTop: 10, flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom)" },
  tabButton: { display: "flex", flexDirection: "column", alignItems: "center", background: "none", border: "none", cursor: "pointer", gap: 3, padding: "0 20px" },
  tabIcon: { fontSize: 24 },
  tabLabel: { fontSize: 11, fontWeight: 600 },
  page: { padding: "20px 20px 32px" },
  homeHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  appBadge: { display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 20, padding: "6px 14px", marginBottom: 6 },
  appBadgeText: { color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: -0.5 },
  homeSubtitle: { color: "#6B7280", fontSize: 13, margin: 0 },
  addButton: { width: 44, height: 44, borderRadius: 22, border: "none", color: "#fff", fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  addForm: { background: "#fff", borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  formTitle: { fontWeight: 700, fontSize: 16, color: "#111", margin: "0 0 12px" },
  fieldLabel: { fontSize: 12, fontWeight: 700, color: "#6B7280", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 },
  formInput: { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 15, marginBottom: 10, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#FAFAFA" },
  iconPicker: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  iconOption: { width: 44, height: 44, borderRadius: 12, border: "1.5px solid", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" },
  saveButton: { width: "100%", padding: "13px", borderRadius: 14, border: "none", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" },
  categoryScroll: { display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4, scrollbarWidth: "none" },
  categoryChip: { padding: "8px 16px", borderRadius: 20, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  emptyBox: { textAlign: "center", padding: "40px 20px" },
  loadingText: { color: "#6B7280", fontSize: 15, margin: 0 },
  emptyText: { color: "#374151", fontSize: 16, fontWeight: 700, margin: "0 0 8px" },
  emptySubText: { color: "#9CA3AF", fontSize: 14, margin: 0 },
  messageGrid: { display: "grid", gap: 14 },
  messageCard: { background: "#fff", borderRadius: 20, padding: 16, border: "none", cursor: "pointer", textAlign: "left", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 },
  cardIconBg: { width: 56, height: 56, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center" },
  cardIcon: { fontSize: 30 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#111", margin: 0, lineHeight: 1.3 },
  cardBadge: { fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5 },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  backButton: { background: "#fff", border: "none", fontWeight: 700, fontSize: 16, cursor: "pointer", padding: "8px 16px", borderRadius: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  editButton: { background: "#DBEAFE", border: "none", fontSize: 18, cursor: "pointer", padding: "8px 12px", borderRadius: 16 },
  deleteButton: { background: "#FEE2E2", border: "none", fontSize: 18, cursor: "pointer", padding: "8px 12px", borderRadius: 16 },
  detailHero: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 },
  detailIconBg: { width: 100, height: 100, borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  detailIcon: { fontSize: 52 },
  detailBadge: { fontSize: 12, fontWeight: 700, padding: "5px 16px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5 },
  detailTitle: { fontSize: 24, fontWeight: 800, color: "#111", textAlign: "center", margin: "0 0 20px", lineHeight: 1.25 },
  detailCard: { background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, display: "flex", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  detailContent: { fontSize: 16, lineHeight: 1.7, color: "#374151", margin: 0 },
  reflectBox: { borderRadius: 20, padding: 20 },
  reflectTitle: { fontWeight: 700, fontSize: 15, margin: "0 0 8px" },
  reflectText: { fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: 0 },
  authorHero: { display: "flex", justifyContent: "center", marginBottom: 20 },
  authorAvatarBg: { width: 100, height: 100, borderRadius: 50, background: "linear-gradient(135deg, #DBEAFE, #EFF6FF)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fff" },
  authorAvatar: { fontSize: 52 },
  authorInfo: { textAlign: "center", marginBottom: 24 },
  authorName: { fontSize: 24, fontWeight: 800, color: "#111", margin: "0 0 6px" },
  authorTitle: { fontWeight: 600, fontSize: 14, margin: 0 },
  statsRow: { display: "flex", gap: 12, marginBottom: 20 },
  statBox: { flex: 1, background: "#fff", borderRadius: 16, padding: "14px 10px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  statValue: { fontSize: 22, fontWeight: 800, margin: "0 0 4px" },
  statLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: 600, margin: 0 },
  bioCard: { background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  bioTitle: { fontWeight: 700, fontSize: 16, color: "#111", margin: "0 0 10px" },
  bioText: { fontSize: 14, color: "#6B7280", lineHeight: 1.7, margin: 0 },
  missionCard: { borderRadius: 20, padding: 20, textAlign: "center" },
  missionTitle: { fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.8)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 },
  missionText: { fontSize: 14, color: "#fff", lineHeight: 1.7, margin: 0, fontStyle: "italic" },
  footerNote: { textAlign: "center", fontSize: 10, color: "#B0B8C4", marginTop: 24, marginBottom: 0, letterSpacing: 0.3, fontStyle: "italic" },
  adminLoginBox: { background: "#fff", borderRadius: 24, padding: 28, marginTop: 40, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  adminLoginTitle: { fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center", margin: "0 0 8px" },
  adminLoginSub: { fontSize: 14, color: "#6B7280", textAlign: "center", margin: "0 0 20px" },
  errorText: { color: "#DC2626", fontSize: 13, textAlign: "center", margin: "0 0 12px" },
  adminHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  adminHeaderTitle: { fontWeight: 800, fontSize: 18, color: "#111", margin: 0 },
  adminHeaderSub: { fontSize: 13, color: "#6B7280", margin: 0 },
  logoutButton: { background: "#FEE2E2", border: "none", color: "#DC2626", fontWeight: 700, fontSize: 13, padding: "8px 14px", borderRadius: 20, cursor: "pointer" },
  adminMsgCard: { background: "#fff", borderRadius: 16, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
};
