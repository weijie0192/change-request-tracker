'use strict';

/**
 * @author Wei Zheng
 * @description create, read, upload, and delete messages
 */

const VerificationHelper = use('App/Helper/VerificationHelper');
const MessageService = use('App/Service/MessageService');
const MapHelper = use('App/Helper/MapHelper');

class MessageController {
  constructor() {
    this.messageService = new MessageService();
  }

  /**
   * Create new message
   */
  async createMessage({ auth, request, response }) {
    const user = await auth.getUser();
    // map receive list data
    try {
      const receiverList = MapHelper.mapReceiveData(user, request);
      if (receiverList.length > 0) {
        const result = await this.messageService.createMultiMessage(
          receiverList
        );
        return result;
      }
    } catch (e) {}
    return response.status(406).send('Wrong Format');
  }

  /**
   * Get message detail
   */
  async getMessage({ auth, params }) {
    const user = await auth.getUser();

    const message = await this.messageService.getMessage(user, params.id);

    VerificationHelper.verifyExistance(message, 'message');
    return message;
  }

  /**
   * Get message list by type. Inbox, sent, or archived
   */
  async getMessageList({ auth, request }) {
    const user = await auth.getUser();
    const result = await this.messageService.getMessageList(user, request);

    return result;
  }

  /**
   * clear new messages
   * @returns {String}
   */
  async clearNewMessages({ auth }) {
    const user = await auth.getUser();
    const result = await this.messageService.clearNewMessages(user);
    return result;
  }

  /**
   * archive message
   */
  async archiveMessage({ auth, request }) {
    const user = await auth.getUser();
    const result = await this.messageService.archiveMessage(user, request);
    return result;
  }
  /**
   * update target
   * @returns {message}
   */
  async updateMessage({ auth, request, params }) {
    const user = await auth.getUser();
    var message = await this.messageService.updateMessage(
      params.id,
      request,
      user
    );
    VerificationHelper.verifyExistance(message, ' message');
    return message;
  }
}

module.exports = MessageController;
