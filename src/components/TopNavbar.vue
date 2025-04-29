<template>
  <nav class="top-navbar" @click="esc($event)">
    <!-- Logo -->
    <img src="../assets/img/RA_logo_v3.png" alt="RiskAtlas" class="logo">
    <!-- Buttons -->
    <ul class="navbar-menu">
      <li v-for="item in menu_items" :key="item.id" class="menu-item" :class="{selected: activeMenuRef === item.id}" @click="updateActiveMenuRef(item.id)">{{ item.name }}</li>
    </ul>
    <!-- Login Button -->
    <button class="login-btn">Login</button>
  </nav>
</template>

<script setup lang="ts">
import { NavbarItem } from "../types/types";
import { useNavbarStore } from "../stores/useNavbarStore";

const { activeMenuRef, updateActiveMenuRef } = useNavbarStore();

const props = defineProps<{
  menu_items: NavbarItem[];
}>();

function esc(evt: any) {
  if (!evt.target?.classList.contains('menu-item')) {
    updateActiveMenuRef(null);
  }
}
</script>

<style scoped>
.top-navbar {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  height: 3rem;
  background: var(--RA-dark-gray);
}

.logo {
  height: 2rem;
  margin-right: 2rem;
  user-select: none;
}

.navbar-menu {
  display: flex;
  flex: 1;
  justify-content: center;
  gap: 1.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  font-weight: 500;
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  padding: 1rem 1rem;
  user-select: none;
}

.menu-item:hover {
  cursor: pointer;
  background-color: var(--RA-light-gray);
}

.menu-item.selected {
  color: var(--RA-aqua-accent);
}

.login-btn {
  background: var(--RA-deep-teal);
  color: #fff;
  padding: .5rem 1rem;
  border-radius: .375rem;
  transition: background .15s;
  border: none;
  cursor: pointer;
  font-weight: bold;
  user-select: none;
}

.login-btn:hover {
  background: var(--RA-aqua-accent);
}
</style>
