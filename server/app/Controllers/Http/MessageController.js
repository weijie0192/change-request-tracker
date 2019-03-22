'use strict';

/**
 * @author Wei Zheng
 * @description create, read, upload, and delete messages
 */

const Message = use('App/Models/Message');
const AuthorizationService = use('App/Service/AuthorizationService');
const MessageService = use('App/Service/MessageService');
const CrudService = use('App/Service/CrudService');
const Database = use('Database');

class MessageController {
  /**
   * Create new message
   */
  async createMessage({ auth, request }) {
    const user = await auth.getUser();
    const { receiver, title, content } = request.only([
      'receiver',
      'title',
      'content'
    ]);

    const receiverList = new Array(receiver.length).fill().map((a, i) => ({
      receiverEmail: receiver[i].substring(
        receiver[i].indexOf('(') + 1,
        receiver[i].lastIndexOf(')')
      ),
      senderEmail: user.email,
      senderName: user.full_name,
      title: title,
      content: content
    }));
    const { isReply } = request.only('isReply');

    for (let rl of receiverList) {
      AuthorizationService.validateMessage(rl);
      if (isReply) {
        await MessageService.createMessage(rl);
      } else {
        await MessageService.createReplyMessage(rl);
      }
    }

    return receiverList;
  }

  /**
   * Get message detail
   */
  async getMessage({ auth, params }) {
    const user = await auth.getUser();
    const message = await Message.query()
      .where('senderEmail', user.email)
      .andWhere('id', params.id)
      .fetch();

    AuthorizationService.verifyExistance(message.rows[0], 'message');
    return message.rows[0];
  }

  /**
   * Get message list by type. Inbox, sent, or archived
   */
  async getMessageList({ auth, request }) {
    const user = await auth.getUser();
    const { type, page, limit, search } = request.all();
    const searchData = search || '';
    // const search = `%${table.search.value}%`;
    const messages = await Message.query()
      .where(function() {
        switch (type) {
          case 'sent':
            this.where('senderEmail', user.email);
            break;
          case 'inbox':
            this.where('receiverEmail', user.email).andWhere(
              'isArchived',
              false
            );
            break;
          case 'archive':
            this.where('receiverEmail', user.email).andWhere(
              'isArchived',
              true
            );
            break;
        }
      })
      .where(function() {
        this.where('senderEmail', 'like', `%${searchData}%`)
          .orWhere(function() {
            const splitSearch = searchData.split(' ');
            for (let split of splitSearch) {
              // split the string and search each splitted item
              this.where('senderName', 'like', `%${split || 'N/A'}%`);
            }
          })
          .orWhere('receiverEmail', 'like', `%${searchData}%`)
          .orWhere('title', 'like', `%${searchData}%`)
          .orWhere('created_at', 'like', `%${searchData}%`)
          .orWhere(
            'isBookmark',
            `${
              searchData ? (search.toLowerCase().includes('mark') ? 1 : -1) : ''
            }`
          );
      })
      .orderBy('created_at', 'desc')
      .paginate(page, limit);

    const pageMax = page * limit;
    messages.pages.end =
      pageMax > messages.pages.total ? messages.pages.total : pageMax;
    messages.pages.start = pageMax + 1 - limit;
    // console.log(messages);
    return messages;
  }

  /**
   * clear new messages
   * @returns {String}
   */
  async clearNewMessages({ auth }) {
    const user = await auth.getUser();
    return await MessageService.clearNewMessages(user);
  }

  /**
   * delete target
   * @returns {message}
   */
  async deleteMessage({ auth, params }) {
    return CrudService.destroy(auth, params, Message, {
      verify: (user, message) =>
        AuthorizationService.verifyMessageOwnership(message, user)
    });
  }

  /**
   * update target
   * @returns {message}
   */
  async updateMessage({ auth, request, params }) {
    return CrudService.update(auth, params, Message, {
      verify: (user, message) =>
        AuthorizationService.verifyMessageOwnership(message, user),
      work: message =>
        message.merge(request.only(['isRead', 'isArchived', 'isBookmark']))
    });
  }

  /**
   * archive message
   */
  async archiveMessage({ auth, request }) {
    const user = await auth.getUser();
    const { list, isArchived } = request.only(['list', 'isArchived']);

    if (!list || list.length <= 0) {
      throw Exception('Empty List');
    }

    await Message.query()
      .where('receiverEmail', user.email)
      .whereIn('id', list)
      .update({ isArchived });
  }
}

module.exports = MessageController;
