// src/api/memberAPI.js
const API_URL = "http://localhost:3000/api/members";

export const getMembers = async () => {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(API_URL, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error("Failed to fetch members");
    return await res.json();
  } catch (error) {
    console.error("Error fetching members:", error);
    return null;
  }
};

export const getMemberById = async (id) => {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_URL}/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error("Failed to fetch member");
    return await res.json();
  } catch (error) {
    console.error("Error fetching member:", error);
    return null;
  }
};

export const createMember = async (memberData) => {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData),
    });
    return await res.json();
  } catch (error) {
    console.error("Error creating member:", error);
    return { error: error.message };
  }
};

export const updateMember = async (id, memberData) => {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(memberData),
    });
    return await res.json();
  } catch (error) {
    console.error("Error updating member:", error);
    return { error: error.message };
  }
};

export const deleteMember = async (id) => {
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return await res.json();
  } catch (error) {
    console.error("Error deleting member:", error);
    return { error: error.message };
  }
};
