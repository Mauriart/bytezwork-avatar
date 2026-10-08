import AgentRobotAvatar from './index.js';
export class BytezWorkAvatar extends AgentRobotAvatar {}
export default BytezWorkAvatar;
declare global {
  interface HTMLElementTagNameMap {
    'bytezwork-avatar': BytezWorkAvatar;
  }
}
