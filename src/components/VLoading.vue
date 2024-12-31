<template>
  <div class="loading-container">
    <div class="spinner" />
    <span>Loading data ...</span>
  </div>
</template>

<style lang="css" scoped>
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 15;
  color: #FFF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.6);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 6px solid rgba(255, 255, 255, 0.2);
  border-top: 6px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

span {
  font-size: 1.2rem;
  letter-spacing: 0.05em;
}
</style>
